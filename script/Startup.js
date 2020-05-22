

// Initialisation de l'application
$(document).ready( function() {

  var api=new HeatzyAPI();

  lp=new LoginProvider();
  var account=new Account(lp,api);
  account.onConnect(initPage);
  $("#allContent").data("account",account);

  // force initial login
  account.getToken();
});

// This, actually, may work differently according to browser behavior/implementation. At least,i tried :)
$(window).bind("beforeunload",function() {
  if (!$("#saveBox").hasClass("invisible"))
    return "Quitter la page sans sauvegarder vos modifications ?";
});
