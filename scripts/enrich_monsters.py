import boto3
import json
import time
import os
import re
from botocore.exceptions import ClientError

# ---Configuration---
current_dir = os.path.dirname(os.path.abspath(__file__))
tableName = "DnD_Monsters"
modelID = "us.anthropic.claude-haiku-4-5-20251001-v1:0"
regionsFile = os.path.join(current_dir, "../src/regions.json")
dynamoDB = boto3.resource("dynamodb", region_name="us-east-1")
bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")
table = dynamoDB.Table(tableName)


def load_region_context():
    """Reads your local regions.json to build a smart prompt context."""
    try:
        with open(regionsFile, "r") as file:
            data = json.load(file)

        regionDescriptions = []
        regionName = []

        for feature in data:
            props = feature["properties"]
            name = props["name"]
            regionName.append(name)

            desc = (
                f"- {name}: "
                f"Climate: {', '.join(props.get('climate', []))}. "
                f"Terrian: {', '.join(props.get('terrian', []))}. "
                f"Vibes: {', '.join(props.get('vibes', []))}. "
                f"Dominant Monsters: {', '.join(props.get('dominant_monster', []))}. "
                f"Major Factions: {', '.join(props.get('major_factions', []))}. "
                f"Danger Level: {', '.join(props.get('danger_level', []))}. "
                f"Keywords: {', '.join(props.get('keywords', []))}. "
            )
            regionDescriptions.append(desc)

        return regionName, "\n".join(regionDescriptions)
    except FileNotFoundError:
        print(f"Error: Could not find {regionsFile}")
        return [], ""


def get_db_monsters():
    """Scans DynamoDB for all monsters."""
    print(f"Scanning table '{tableName}'...")
    response = table.scan()
    return response["Items"]


def classify_monster(monsterData, regionNames, regionContext):
    """Asks Claude to pick a region based on your specific JSON definitions."""
    # Prepare Monster Profile
    description = f"""
    Name: {monsterData.get('name')}
    Size: {monsterData.get('size')}
    Type: {monsterData.get('type')}
    Alignment: {monsterData.get('alignment', 'None')}
    Languages: {monsterData.get('languages', 'None')}
    Challenge Rating: {monsterData.get('challenge_rating')}
    Special Abilities: {monsterData.get('special_abilities', 'None')}
    Actions: {monsterData.get('actions', 'None')}
    Legendary Actions: {monsterData.get('legendary_actions', 'None')}
    Reactions: {monsterData.get('reactions', 'None')}
    """

    # Build Prompt using regions
    prompt = f"""
    You are a D&D expert populating a Faerûn map.
    Assign the monster below to the following regions. If the Challenge Rating
    is low it can more common, and if the Challenge Rating is high it can be 
    more rare.
    
    Here are the regions and their themes:
    {regionContext}
    
    CRITICAL RULES:
    1. Return ONLY a valid JSON object. No Markdown. No conversational text.
    2. Format: {{"regions": ["Region A", "Region B", "Region C", ...]}}
    3. The "region" must match one of the names provided exactly.
    
    Monster to Assign:
    {description}
    """

    conversation = [{"role": "user", "content": [{"text": prompt}]}]

    try:
        response = bedrock.converse(
            modelId=modelID,
            messages=conversation,
            inferenceConfig={"maxTokens": 300, "temperature": 0.1},
        )
        response_text = response["output"]["message"]["content"][0]["text"]
        clean_text = re.sub(r"```json\s*", "", response_text)
        clean_text = re.sub(r"```\s*", "", clean_text)

        return json.loads(clean_text)

    except Exception as e:
        print(f"Error classifying {monsterData.get('name')}: {e}")
        return None


def update_monster_in_db(monster_name, classification):
    """Updates DynamoDB with the new region"""
    if not classification:
        return

    try:
        table.update_item(
            Key={"name": monster_name},
            UpdateExpression="set #r = :r",
            ExpressionAttributeNames={"#r": "region"},
            ExpressionAttributeValues={":r": classification["region"]},
        )
        return True
    except ClientError as e:
        print(f"DB Error: {e}")
        return False


if __name__ == "__main__":
    # Load regions
    print("Loading region attributes...")
    reg_names, reg_context = load_region_context()

    if not reg_names:
        print("Stopping: No regions found.")
        exit()

    # Get monsters
    monsters = get_db_monsters()
    print(f"Found {len(monsters)} monsters to process.")

    count = 0
    for m in monsters:
        # If already classified then skip the monster
        if "region" in m and m["region"] != "Unknown":
            print(f"Skipping {m['name']} (Already in {m['region']})")
            continue

        print(f"Analyzing {m['name']}...", end=" ", flush=True)

        # Classify monsters
        result = classify_monster(m, reg_names, reg_context)

        if result:
            # Update Database
            print(f"-> {result['region']}")
            update_monster_in_db(m["name"], result)
            count += 1
        else:
            print("-> Failed")

        time.sleep(30)  # Avoid AWS throttling

    print(f"\n Done! Updated {count} monsters.")
