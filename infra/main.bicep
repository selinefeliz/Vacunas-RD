@description('Nombre del App Service a crear')
param appServiceName string

@description('Location for resources (defaults to resource group location)')
param location string = resourceGroup().location

@description('SKU for App Service Plan')
param skuName string = 'S1'

resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: '${appServiceName}-plan'
  location: location
  sku: {
    name: skuName
    tier: 'Standard'
    capacity: 1
  }
  properties: {}
}

resource webApp 'Microsoft.Web/sites@2022-03-01' = {
  name: appServiceName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
  }
}

output webAppName string = webApp.name
