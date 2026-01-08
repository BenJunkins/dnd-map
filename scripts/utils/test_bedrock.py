import boto3
from botocore.exceptions import ClientError, NoCredentialsError

modelID = "us.anthropic.claude-haiku-4-5-20251001-v1:0"

def test_connection():
    print(f"Testing connection to AWS Bedrock ({modelID})...")

    try:
        client = boto3.client("bedrock-runtime", region_name = "us-east-1")

        conversation = [{
            "role": "user",
            "content": [{"text": "Hello! Are you online? Reply with just 'Yes'."}]
            }]
        response = client.converse(
                modelId = modelID,
                messages = conversation,
                inferenceConfig = {"maxTokens": 10}
                )
        answer = response["output"]["message"]["content"][0]["text"]

        print(f"Success! Model replied: {answer}")
        return True

    except NoCredentialsError:
        print("Error: Could not find AWS Credentials.")
        print("   -> Run 'aws configure' in your terminal again.")
    except ClientError as e:
        print(f"AWS Error: {e}")
        print("   -> Check if you requested 'Model Access' in the AWS Console.")
    except Exception as e:
        print(f"Unexpected Error: {e}")
    
    return False

if __name__ == "__main__":
    test_connection()
