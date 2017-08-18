module.exports = {
    connectionString: process.env.connectionString,
    mongoIdRegex: /^[A-Za-z0-9]{24}$/,
    alphaNumericRegex: /^[a-zA-Z0-9_]{1,}$/,
    searchQueryRegex: /^[a-zA-z0-9 _@#]{1,}$/,
    secretKey : process.env.secretKey,
    ImageAPIKey: process.env.azureKey
}
