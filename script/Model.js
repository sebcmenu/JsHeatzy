
////////////////////////////////////////////////////////////////////////////
// fonction Helper

// fonction de rendu en heure d'un index dans un tableau de programmation
function toHour(index) {
  let h=index/2;
  var res="";
  if (h<10)
    res="0";
  res=res+Math.trunc(h);
  if ((index % 2) ==1)
      res=res+":30";
  else
    res=res+":00";
  return res;
}

// modes accessibles
const HEATZYMODE= {
  CONFORT: {id:0,clazz:"confort",btClazz:"warning"},
  ECO: {id:1,clazz:"eco",btClazz:"success"},
  HORSGEL: {id:2,clazz:"horsgel",btClazz:"primary"},
  OFF: {id:3,clazz:"off",btClazz:"dark"}
}

// fonction Helper permettant de trouver l'object Mode avec l'identifiant fourni
function getMode(i) {
  var res=HEATZYMODE.ECO;
  for (var m in HEATZYMODE) {
    if (HEATZYMODE[m] && HEATZYMODE[m].id==i) {
      res=HEATZYMODE[m];
    }
  }
  return res;
}

// les jours de la semaines
const DAYS= {
  MONDAY: {id:1,label:"lundi",abbrv:"Lu"},
  TUESDAY: {id:2,label:"mardi",abbrv:"Ma"},
  WEDNESDAY: {id:3,label:"mercredi",abbrv:"Me"},
  THURSDAY: {id:4,label:"jeudi",abbrv:"Je"},
  FRIDAY: {id:5,label:"vendredi",abbrv:"Ve"},
  SATURDAY: {id:6,label:"samedi",abbrv:"Sa"},
  SUNDAY: {id:7,label:"dimanche",abbrv:"Di"},
}

// fonction Helper permettant de trouver l'object Jour avec l'identifiant fourni
function getDay(index) {
  for (let i in DAYS) {
    if (DAYS[i].id && DAYS[i].id==index) {
      return DAYS[i];
    }
  }
  return DAYS[MONDAY];
}


////////////////////////////////////////////////////////////////////////////
// Modèle objet
// Account : un compte Heatzy auquel sont rattachés des
//   Device : un "boitier Heatzy", qui dispose d'un
//     Schedule : programmation hebdomadaire d'un boitier, repésentée sous forme
//       DaySchedule : tableau de programmation d'un jour donné de la semaine
//
// Les DaySchedule ont également une représentation sous forme de liste de DayRange,
//  qui représentent les plages de programmation contigues d'un même mode de chauffage
// les Schedule ont également une représentation sous forme de WeeklyRange, qui
// consolident les DayRange se répétant sur différents jours

// un compte Heatzy
function Account(loginProvider,api) {
  // attributes
   this.token=null;
   this.api=api;
   this.devices=null;

   // controller bindings
   this.loginProvider=loginProvider;
   this.loginProvider.setListener(this);

   this.notify= function (login,password) {
     this.login=login;
     this.password=password;
     this.api.connect(this.login,this.password,this,$.proxy(function(lp,msg) {setTimeout(function() {lp.provideLogin(msg);},500)},null,this.loginProvider));
   }

   this.onConnect=function (f) {
     this.eventConnectedCallBack=f;
   }

   // class functions
   this.getToken=function() {
      if (this.token==null) {
        this.loginProvider.provideLogin("");
      }
      return this.token;
   };

   this.setToken=function (t) {
     this.token=t;
     if (this.eventConnectedCallBack) {
       this.eventConnectedCallBack(this);
     }
   }

   this.addDevice=function (d) {
     this.devices.push(d);
   }

   this.setDevices=function (ds) {
     this.devices=ds;
     var api=this.api;
     ds.forEach(function(item) {

       item.setApi(api);
     });
   }

   this.getDevices=function(callback) {
     if (this.devices==null) {
       this.devices=this.api.listDevices(this,callback);
     }
     return this.devices;
   }



}

// un boitier Heatzy (ici appelé Device)
function Device(account,jso) {
  // Class attributes
    this.id=jso.did;
    this.alias=jso.dev_alias;
    this.schedule=null;
    this.account=account;
    this.loadingInProgress=false;
    this.updated=false;

    this.getSchedule=function (callback)  {
      if (this.schedule==null) {
        if (this.loadingInProgress==false) {
          this.api.loadSchedule(this,this.id,this.account,callback);
          this.loadingInProgress=true;
        }
        }

      return this.schedule;
    }

    this.setUpdated=function(b) {
      this.updated=b;
    }

    this.isUpdated=function() {
      return this.updated;
    }

    this.setSchedule=function (scheduleP) {
      this.schedule=scheduleP;
    }
    this.setApi=function (api) {
      this.api=api;
    }

    this.removeRange=function (rangeHash) {
      var sch=this.getSchedule(null);
      var ranges=sch.getRanges().slice();
      sch.clear(HEATZYMODE.ECO);
      $(ranges).each(function (index,item) {
        var r=item.getRange();
        if (r.mode!=HEATZYMODE.ECO && r.hashCode!=rangeHash) {
          sch.applyRange(item);
        }
      });
      sch.updateRequired();
    }

    this.saveSchedule=function() {
      this.api.saveSchedule(this.account,this);
    }
}

// objet représentatn une programmation hebdomadaire d'un device (ie 7 programmations quotidiennes)
function Schedule() {

  this.days=new Map();
  this.ranges=new Array();
  this.needUpdate=true;
  for (var d in DAYS) {
      if (Object.prototype.hasOwnProperty.call(DAYS, d)) {
          this.days[DAYS[d].label]= new DaySchedule(d,this,this.api);
      }
  }

  this.updateRequired=function() {
    this.needUpdate=true;
  };

  this.getDaySchedule=function (d) {
    //alert("Getting day schedule for "+d.label+" \n"+JSON.stringify(this.days));
    return this.days[d.label];
  }

  this.clear=function (mode) {
    for (var ds in this.days) {
      if (Object.prototype.hasOwnProperty.call(this.days, ds)) {
          this.days[ds].clear(mode);
      }
    }
  }

  this.applyRange=function(wr) {
    var ds=wr.getDays();
    for (var dw in ds ){
      if (Object.prototype.hasOwnProperty.call(ds, dw)) {
          this.days[ds[dw].label].setMode(wr.getRange());
      }
    }
  }

  this.getRanges=function() {
    if (this.needUpdate) {
      this.computeRanges();
    }
    return this.ranges;
  }

  this.computeRanges=function () {
    this.ranges=new Array();
    var dRanges=new Array(7);

    for (var d in DAYS) {
        if (Object.prototype.hasOwnProperty.call(DAYS, d)) {
            dRanges[DAYS[d].id]= this.days[DAYS[d].label].getRanges().slice();
        }
    }

    for (let i=1;i<8;i++) {
        var l=dRanges[i];
        while (l.length>0) {
          var r=l.shift();
          var wr=new WeeklyRange(r,getDay(i));
          for (let j=i+1;j<=7;j++) {
              for(let k=0;k<dRanges[j].length;k++) {
                if (dRanges[j][k].hashCode == r.hashCode) {
                  dRanges[j].splice(k,1);
                  wr.addDay(getDay(j));
                }
              }
          }
          this.ranges.push(wr);
        }
    }
    this.needUpdate=false;
  }
}

// object représentatn la programmation quotidienne d'un device
function DaySchedule(weekday,ws,api) {
  this.wday=weekday;
  this.wschedule=ws;
  this.needUpdate=true;
  this.rawdata=new Array(48);
  this.rawdata.fill(HEATZYMODE.ECO);
  this.ranges=null;

  this.updateRequired=function () {
    this.needUpdate=true;
    this.wschedule.updateRequired();
  }

  this.setMode=function (r) {
    for (let i=r.from;i<r.to;i++) {
      this.rawdata[i]=r.mode;
    }
    this.updateRequired();
	}

  this.setModeAt=function (mode,pos) {

    this.rawdata[pos]=getMode(mode);
    this.updateRequired();
  }

  this.getMode=function (i) {
    return this.rawdata[i];
  }

  this.clear=function (mode) {
    this.rawdata=new Array(48).fill(mode);
    this.updateRequired();
  }

  this.getRanges=function() {

    if (this.needUpdate) {
      this.computeRanges();
    }
    return this.ranges;
  }

  this.computeRanges=function () {
    this.ranges=new Array();
    var currentMode=null;
    let start=0;
    for (let i=0;i<48;i++) {
      if (currentMode!=this.rawdata[i]) {
        if (currentMode!=null) {
          this.ranges[this.ranges.length]=new Range(start,i,currentMode);
        }
        currentMode=this.rawdata[i];
        start=i;
      }
    }
    this.ranges.push(new Range(start,48,currentMode));
    this.needUpdate=false;
  }
}

// objet représentant une plage de programmation
function Range(from,to,mode) {
  this.from=from;
  this.to=to;
  this.mode=mode;
  this.hashCode=""+from+"-"+to+"-"+mode.id;
}

// objet représentant une plage de programmation programmée sur un ou plusieurs jours
function WeeklyRange(r,d) {
  this.range=r;
  this.days=new Array();
  if (d)
    this.days.push(d);

  this.getRange=function () {
    return this.range;
  }
  this.getDays= function () {
    return this.days;
  }

  this.addDay=function (d) {
    for (i=0;i<this.days.length;i++) {
      if (d.id==this.days[i].id)
        return;
    }
    this.days[this.days.length]=d;
  }
}
