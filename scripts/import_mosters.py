import json
import urllib3
import boto3
from decimal import Decimal
from utils.parse_json_object import parse_json_object

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("DnD_Monsters")
http = urllib3.PoolManager()


def import_monsters():
    query = """
    query {
            monsters(limit: 500) {
                index
                name
                size
                type
                alignment
                languages
                challenge_rating
                xp
                special_abilities {
                        name
                        desc # Used for enrichment
                        usage {
                            type
                            times
                            }
                        }
                actions {
                        name
                        desc # Used for enrichment
                        }
                legendary_actions {
                        name
                        desc # Used for enrichment
                        }
                reactions {
                        name
                        desc # Used for enrichment
                        }
                }
            }
    """

    url = "https://www.dnd5eapi.co/graphql"
    encoded_body = json.dumps({"query": query}).encode("utf-8")

    try:
        response = http.request(
            "POST", url, body=encoded_body, headers={"Content-Type": "application/json"}
        )
        data = json.loads(response.data.decode("utf-8"))
        monsters = data["data"]["monsters"]
        print(f"Retrieved {len(monsters)} monsters.")

        # If graphql throws an error in a field
        if "errors" in data:
            raise Exception(f"GraphQL Error: {data['errors']}")

        with table.batch_writer() as batch:
            for monster in monsters:
                clean_monster = parse_json_object(monster)
                item = {
                    "id": clean_monster.get("index"),
                    "name": clean_monster.get("name"),
                    "size": clean_monster.get("size"),
                    "type": clean_monster.get("type"),
                    "alignment": clean_monster.get("alignment"),
                    "languages": clean_monster.get("languages"),
                    "cr": clean_monster.get("challenge_rating", Decimal(0)),
                    "xp": clean_monster.get("xp", Decimal(0)),
                    "special_abilities": clean_monster.get("special_abilities", []),
                    "actions": clean_monster.get("actions", []),
                    "legendary_actions": clean_monster.get("legendary_actions", []),
                    "reactions": clean_monster.get("reactions", []),
                    "region": {"SS": ["Unknown"]},
                }
                batch.put_item(Item=item)
        return {
            "statusCode": 200,
            "body": json.dumps(f"Loaded {len(monsters)} monsters."),
        }

    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return {"statusCode": 500, "body": str(e)}


if __name__ == "__main__":
    import_monsters()
