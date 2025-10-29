aws dynamodb create-table `
    --table-name messages `
    --attribute-definitions `
        AttributeName=chatid,AttributeType=S `
        AttributeName=timestamp_utc,AttributeType=N `
    --key-schema AttributeName=chatid,KeyType=HASH AttributeName=timestamp_utc,KeyType=RANGE `
    --billing-mode PAY_PER_REQUEST `
    --table-class STANDARD `
    --endpoint-url http://localhost:8000