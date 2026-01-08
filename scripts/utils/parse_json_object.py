from decimal import Decimal

def parse_json_object(obj):
    """
    Recursively helps format data for DynamoDB:
    1. Converts all floats to Decimals (Boto3 requires this).
    2. Converts empty strings to None (DynamoDB dislikes empty strings).
    """
    if isinstance(obj, list):
        return [parse_json_object(i) for i in obj]
    elif isinstance(obj, dict):
        return {key: parse_json_object(value) for key, value in obj.items() if value != ""}
    elif isinstance(obj, float):
        return Decimal(str(obj))
    elif obj == "":
        return None
    else:
        return obj

