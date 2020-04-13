/* global Module */

/* Magic Mirror
 * Module: MMM-CuandoLlega
 *
 * By Jose Forte
 * MIT Licensed.
 */

Module.register("MMM-CuandoLlega", {
  busesInfo: [],
  defaults: {
    header: 'Cuando Llega',
    buses: [
      {
        line: '120', // 120 Único
        stop: 8317
      },
      {
        line: '153 N', // 153 Negra
        stop: 4146
      },
      {
        line: '153 R', // 153 Roja
        stop: 4146
      }
    ],
    mmLocation: [ -32.9536595, -60.6431701 ], // [ latitude, longitude ]
    updateInterval: 30000, // update interval in milliseconds
    fadeSpeed: 4000,
    infoClass: 'big' // small, medium or big
  },

  getStyles: function() {
    return ["MMM-CuandoLlega.css"]
  },

  start: function() {
    Log.info("Starting module: " + this.name);
    
    this.config.buses.forEach(info => {
      this.getBusInfo(info)
    })

    this.scheduleUpdate()
  },
  // https://docs.magicmirror.builders/development/core-module-file.html#suspend
  // used in combination with ModuleScheduler in order to halt the timers
  suspend: function() {
    window.clearInterval(this.intervalID)
  },

  resume: function() {
    this.scheduleUpdate()
  },

  scheduleUpdate: function(delay) {
    var nextLoad = this.config.updateInterval
    if (typeof delay !== "undefined" && delay >= 0) {
      nextLoad = delay
    }
    var self = this
    this.intervalID = setInterval(function() {
      self.busesInfo = [] // prevent redrawing twice the same info
      self.config.buses.forEach(info => {
        self.getBusInfo(info)
      })
    }, nextLoad)
  },

  getBusInfo: function (info) {
    this.sendSocketNotification('GET_INFO', info)
  },

  socketNotificationReceived: function(notification, payload) {
    var self = this
    if (notification === "BUS_RESULT") {
      if (payload.length !== 0) { // update DOM only if it's needed
        this.busesInfo.push(payload)
        this.updateDom(self.config.fadeSpeed)
      }
    }
  },

  getHeader: function() {
    return this.config.header
  },

  getDom: function() {
    var wrapper = document.createElement("table")
    if (Object.entries(this.busesInfo).length === 0) return wrapper

    var busList = this.config.buses
    var busesInformation = this.busesInfo

    wrapper.className = 'cuandollega ' + this.config.infoClass

    var self = this
    this.busesInfo.forEach(bus => {
      let nearBuses = bus[0].arribos
      let lineInfo = bus[0].linea
      
      let first = true
      for (let key in nearBuses) {
        let value = nearBuses[key]

        let busRow = document.createElement("tr"),
          busSymbolCell = document.createElement("td"),
          busLineCell = document.createElement("td"),
          busDistanceCell = document.createElement("td"),
          busMinutesCell = document.createElement("td");
        
        if (nearBuses.length == 1) busRow.className = 'last' // some lines could have only 1 arrival time
        else busRow.className = first ? '' : 'last'
        busSymbolCell.innerHTML = first ? '<i class="fas fa-bus"></i>' : ''
        busSymbolCell.className = 'bus-symbol'
        busLineCell.innerHTML = first ? lineInfo['nombreCorto'] : ''
        busLineCell.className = 'bus-line'
        busDistanceCell.innerHTML = self.distanceToMM(value['latitud'], value['longitud'])
        busDistanceCell.className = 'bus-distance number'
        busMinutesCell.innerHTML = value['arriboEnMinutos'] + ' min'
        let proximityClass = ''
        if (value['arriboEnMinutos'] <= 3 ) {
          proximityClass = 'arriving'
        } else if(value['arriboEnMinutos'] > 3 && value['arriboEnMinutos'] <= 5) {
          proximityClass = 'close'
        } else proximityClass = 'faraway'
       
        busMinutesCell.className = proximityClass + ' number'
        
        busRow.appendChild(busSymbolCell)
        busRow.appendChild(busLineCell)
        busRow.appendChild(busDistanceCell)
        busRow.appendChild(busMinutesCell)

        wrapper.appendChild(busRow)

        first = false
      }
    })
   
		return wrapper
  },
  // distance from the upcoming bus to where my MagicMirror is located
  distanceToMM: function(lat2,lon2) {
    lat1 = this.config.mmLocation[0]
    lon1 = this.config.mmLocation[1]

    var R = 6371; // km (change this constant to get miles)
    var dLat = (lat2-lat1) * Math.PI / 180;
    var dLon = (lon2-lon1) * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180 ) * Math.cos(lat2 * Math.PI / 180 ) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    if (d>1) return Math.round(d)+"km";
    else if (d<=1) return Math.round(d*1000)+"m";
    return d;
  }

})
