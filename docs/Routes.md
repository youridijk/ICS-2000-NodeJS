# REST server routes documentation


## GET /login
Get information about login

### Example
```json
{
  "aesKey":"aaaaaaaaaa",
  "hubMac":"0012AB11AB13"
}
```

## GET /smartmeter/current
Get current data of the smart meter.

### Example
`rawDataArray` is the raw data array returned from KAKU. Not all values are mapped.
```json
{
  "powerConsumedLowTariff": 11111,
  "powerConsumed": 1111,
  "powerProducedLowTariff": 111,
  "powerProduced": 111,
  "currentConsumption": 111,
  "currentProduction": 0,
  "gas": 11,
  "rawDataArray": [
    1111,
    1111,
    1111,
    111,
    111,
    0,
    111,
    0,
    11,
    0,
    1,
    0,
    0,
    0,
    0,
    0,
    4
  ]
}
```

## GET /smartmeter/day?startDate=10-12-2023&endDate=10-15-2023
Get smartmeter data summarized by day for a specific time range. 

NOTE: startDate and endDate needs to be in the American style. This means `month/day/year`.
So, `10-12-2023` equals to 12th of October 2023.

### Example
```json
[
  {
    "date": "2023-10-13T21:00:00.000Z",
    "powerConsumedLowTariff": 0,
    "powerConsumed": 100,
    "powerProducedLowTariff": 0,
    "powerProduced": 10,
    "gas": 0,
    "water": 0
  }
]
```



    this.router.get('/smartmeter/day/week', GETSmartMeterDataByDayPastWeek);
    this.router.get('/smartmeter/day/month', GETSmartMeterDataByDayPastMonth);

    this.router.get('/devices', GETDevices);
    this.router.get('/devices/:entityId', [CheckNumber, CheckGetDevice], GETDevice);
    this.router.get('/devices/:entityId/status', [CheckNumber, CheckGetDevice], GETDeviceStatus);
    this.router.put('/devices/:entityId/status', [CheckNumber, CheckGetDevice], PUTDeviceStatus);
    this.router.put(['/devices/:entityId/status/on', '/devices/:entityId/status/off'], [CheckNumber, CheckGetDevice], PUTOnOff);
    this.router.put('/devices/:entityId/status/dimLevel/:dimLevel', [CheckNumber, CheckGetDevice], PUTDimLevel);
