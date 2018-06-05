typeof exports === 'object' && typeof module !== 'undefined'
  ? module.exports = serviceWorkerApiTest
  : typeof define === 'function' && define.amd && define(serviceWorkerApiTest)

function serviceWorkerApiTest() {
  return new Promise((resolve, reject) => {
    var results = {}
    var serviceWorker = navigator.serviceWorker
    if (!serviceWorker) {
      console.log('not support serviceWorker')
      return reject('not support serviceWorker')
    }
    serviceWorker.register('sw-test.js').then(reg => {
      var onReady = function () {
        var activeWorker = reg.active
        if (!activeWorker) return
        fetch('/pre-test')
          .then(r => r.json())
          .then(result => {
            console.log('pretest', result)
            results.pretest = result
          })
          .catch(err => {
            console.log(err)
          })
        activeWorker.postMessage({
          type: 'report'
        })
      }
      const onActivate = () => {
        var activeWorker = reg.active
        if (!activeWorker) return
        // force refresh: will lost the controller
        if (!serviceWorker.controller) {
          activeWorker.postMessage({
            type: 'claim'
          })
        } else {
          onReady()
        }
      }
      reg.onupdatefound = () => {
        const installingWorker = reg.installing
        installingWorker.onstatechange = () => {
          switch (installingWorker.state) {
            case 'installed':
              onActivate()
            case 'activated':
              window.location.reload()
          }
        }
      }
      onActivate()

      serviceWorker.addEventListener('message', e => {
        var type = e.data.type
        var data = e.data.data
        switch (type) {
          case 'claimed':
            onReady()
            break
          case 'report':
            console.log('test', data)
            results.test = data
            resolve(results)
            break
        }
      })
    })
  })
}

