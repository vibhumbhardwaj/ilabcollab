
(function(exports){

  exports.test = function(){
       return 'This is a function from shared module';
  };

  exports.setVariable = function(newVar){
    variable = newVar;
  }

  exports.getVariable = function(){
    return variable;
  }

}(typeof exports === 'undefined' ? this.shared = {} : exports));

