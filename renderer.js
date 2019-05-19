console.log("Test")
var pathfinder = require('pathfinder1-jaci-js');

pathfinder.generateTank(3,[[1.676,4.572,0],[3,4.572,0],[4,5.486,90]],0.02,4.0,3.0,5.0,(length,cntrTraj,leftTraj,rghtTraj) => {
    console.log(length);
    //console.log(cntrTraj[0]);
    //console.log(cntrTraj);
    //console.log(leftTraj);
    //console.log(rghtTraj);
});