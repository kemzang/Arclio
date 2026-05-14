param location string = resourceGroup().location
param projectName string = 'myapp'
param environment string = 'production'
param sku string = 'Standard_LRS'

var storageAccountName = '${projectName}${environment}${uniqueString(resourceGroup().id)}'
var containerRegistryName = '${projectName}registry${uniqueString(resourceGroup().id)}'

resource storageAccount 'Microsoft.Storage/storageAccounts@2021-02-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: sku
  }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
    }
  }
}

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2021-06-01-preview' = {
  name: containerRegistryName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: false
  }
}

output storageAccountId string = storageAccount.id
output containerRegistryLoginServer string = containerRegistry.properties.loginServer
