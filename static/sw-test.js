self.addEventListener('message', function(e){
  var type = e.data.type
  switch(type){
    case 'claim':
      e.waitUntil(self.clients.claim()
      .then(function() {
        return onClaimed()
      })
      .catch(function() {
        console.log('claim error:', err)
      }))
      break
    case 'report':
      e.waitUntil(report())
      break
  }
})

self.skipWaiting()
self.addEventListener('install', function(e){
  self.skipWaiting()
})
self.addEventListener('fetch', function(e){
  var request = e.request
  var pathname = new URL(request.url).pathname
  if(pathname==='/pre-test'){
    var body = [
      {
        api: 'Clients',
        result: [
          {
            key: 'matchAll',
            has: 'matchAll' in self.clients,
            type: typeof self.clients['matchAll']
          }
        ]
      }
    ]
    e.respondWith(new Response(JSON.stringify(body)))
  }
})

function getClients(callback){
  return self.clients.matchAll({type:'window'}).then(function(clientList) {
    clientList.forEach(callback)
  })
}

function onClaimed(){
  return getClients(function(client){
    client.postMessage({type: 'claimed'})
  })
}

function report(){
  return createReport().then(function(report){
    getClients(function(client){
      client.postMessage({type: 'report', data: report})
    })
  })
}

var tests = {
  Clients: [
    'get',
    'claim',
    'matchAll',
    'openWindow',
  ],
  Client: [
    'frameType',
    'id',
    'type',
    'url',
    'postMessage',
    'focused',
    'visibilityState',
    'focus',
    'navigate'
  ],
  CacheStorage: [
    'delete',
    'has',
    'keys',
    'match',
    'open',
  ],
  Cache: [
    'add',
    'addAll',
    'delete',
    'keys',
    'match',
    'matchAll',
    'put',
  ],
}

function createReport(){
  return new Promise(function(res){
    var report = []
    
    getTest(report, 'CacheStorage', self.caches)

    self.caches.open('default').then(function(cache){
      getTest(report, 'Cache', cache)
    })

    getTest(report, 'Clients', self.clients)
    
    getClients(function(client){
      getTest(report, 'Client', client)
    }).then(function() {
      res(report)
    })
  })
}

function getTest(report, apiName, testObject) {
  var result = []
  tests[apiName].forEach(function(key){
    result.push({
      key: key,
      has: key in testObject,
      type: typeof testObject[key]
    })
  })
  report.push({
    api: apiName,
    result: result
  })
}