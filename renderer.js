
const pathfinder = require('pathfinder1-jaci-js');
const { app } = require('electron');
const ipc = require('electron').ipcRenderer;
const fs = require('fs')

var angularApp = angular.module("myApp", []);

var canvas = document.getElementById("fieldView");
var ctx = canvas.getContext("2d");

var pntCanvas = document.getElementById("pointsView");
var pntCtx = pntCanvas.getContext("2d");

var fieldWidth = 8.23; //meters
var mToCanvasScaler = canvas.height/fieldWidth;

var points = [];

var mouseX;
var mouseY;
var mouseDown;

var userPath;

userPath = ipc.sendSync('get-user-path');
console.log(userPath);

var settingsFile;
try {
    fileContents = fs.readFileSync(userPath + "/user/settings.json");
} catch (err) {
    console.log('No File Found');
    settingsFile = "{}";
}
var settingsData = JSON.parse(settingsFile);

var currentProjectDir = './ExampleProject/Paths/'

var pathsInDir = [];

fs.readdirSync(currentProjectDir).forEach(file => {
    if (file.indexOf('.json') != -1) {
        pathsInDir.push({
            "fileName": file
        });
    }
});

console.log(pathsInDir);

function PointsClear() {
    pntCtx.clearRect(0, 0, pntCanvas.width, pntCanvas.height);
}

var pointHandles = [];
function SetPoints() {
    PointsClear();
    
    for (let i = 0; i < points.length; i++) {
        const element = points[i];
        pointHandles[i] = new pointHandle("rgb(38,34,96)", element[0], element[1]);
        pointHandles[i].update();
    }
}

function pointHandle(color, x, y) {
    this.x = x;
    this.y = y; 
    this.CurrentX = x;
    this.CurrentY = y; 
    this.dragging = false;
    this.update = () => {
        pntCtx.beginPath();
        pntCtx.arc(this.CurrentX*mToCanvasScaler, this.CurrentY*mToCanvasScaler, 5, 0, 2 * Math.PI);
        pntCtx.strokeStyle = color;
        pntCtx.fillStyle = color;
        pntCtx.stroke();
        pntCtx.fill();
    }
   
  }

function UpdatePath() {
    if (points.length > 1) {
        pathfinder.generateTank(points.length,points,0.02,4.0,3.0,5.0,(length,cntrTraj,leftTraj,rghtTraj) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.moveTo(cntrTraj[0].x*mToCanvasScaler, cntrTraj[0].y*mToCanvasScaler);
            for (let i = 0; i < cntrTraj.length; i++) {
                ctx.lineTo(cntrTraj[i].x*mToCanvasScaler, cntrTraj[i].y*mToCanvasScaler);
            }
            ctx.lineWidth = 5;
            ctx.strokeStyle = "#00A8FF";
            ctx.stroke();
        }, (err) => {
            document.getElementsByClassName('canvas-pannel')[0].classList.add('canvas-pannel-error');
            document.getElementsByClassName('canvas-pannel')[0].classList.remove('canvas-pannel-error-remove');
            setTimeout(() => {
                document.getElementsByClassName('canvas-pannel')[0].classList.remove('canvas-pannel-error');
                document.getElementsByClassName('canvas-pannel')[0].classList.add('canvas-pannel-error-remove');
                document.getElementsByClassName('canvas-pannel')[0].style.borderColor = 'white';
            }, 2000);
            console.error(err);
        });
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

angularApp.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if (event.which === 13) {
                scope.$apply(function () {
                    scope.$eval(attrs.ngEnter);
                });
  
                event.preventDefault();
            }
        });
    };
  });

var firstAdd = document.getElementById('firstAdd');

angularApp.controller("myCtrl", function($scope) {
    UpdatePath();
    SetPoints();
    $scope.points = points;

    $scope.pointChange = (value) => {
        if (value != null) {
            points = $scope.points;
            SetPoints();
            UpdatePath();
        }
    }

    $scope.deletePoint = (point) => {
        for (let i = 0; i < points.length; i++) {
            const element = points[i];
            if (point[0] == element[0] &&
                point[1] == element[1] &&
                point[2] == element[2]) {
                points.splice(i, 1);
                SetPoints();
                UpdatePath();
            }
        }
    }
    $scope.addPoint = () => {
        if ($scope.addingPoint0 == null || $scope.addingPoint0 == undefined ||
            $scope.addingPoint1 == null || $scope.addingPoint1 == undefined ||
            $scope.addingPoint2 == null || $scope.addingPoint2 == undefined) {
            
        } else {
            points.push([$scope.addingPoint0, $scope.addingPoint1, $scope.addingPoint2]);
            UpdatePath();
            SetPoints();
            $scope.addingPoint0 = null;
            $scope.addingPoint1 = null;
            $scope.addingPoint2 = null;
            firstAdd.focus();
        }
    }
    pntCanvas.addEventListener("mousemove", (e) => {
        mouseX = e.offsetX/mToCanvasScaler;
        mouseY = e.offsetY/mToCanvasScaler;
        if (mouseDown == true) {
            PointsClear();
            for (let i = 0; i < pointHandles.length; i++) {
                if (pointHandles[i].dragging == true) {
                    pointHandles[i].CurrentX = mouseX;
                    pointHandles[i].CurrentY = mouseY;
                }
                pointHandles[i].update();
            }
        }
    }, false);
    pntCanvas.addEventListener("mousedown", (e) => {
        console.log("mousedown");
        mouseDown = true;
        mouseX = e.offsetX/mToCanvasScaler;
        mouseY = e.offsetY/mToCanvasScaler;
        for (let i = 0; i < pointHandles.length; i++) {
            if (mouseX < pointHandles[i].CurrentX+0.2 &&
                mouseX > pointHandles[i].CurrentX-0.2 &&
                mouseY < pointHandles[i].CurrentY+0.2 &&
                mouseY > pointHandles[i].CurrentY-0.2
            ){
                console.log("Dragging" + i);
                pointHandles[i].dragging = true;
            }
            
        }
        console.log(pointHandles);
    });
    pntCanvas.addEventListener("mouseup", (e) => {
        mouseDown = false;
        console.log("mouseup");
        PointsClear();
        for (let i = 0; i < pointHandles.length; i++) {
            if (pointHandles[i].dragging == true) {
                points[i][0] = Number(pointHandles[i].CurrentX.toFixed(2));
                points[i][1] = Number(pointHandles[i].CurrentY.toFixed(2));
                pointHandles[i].dragging = false;
            }
        }
        UpdatePath();
        SetPoints();
        $scope.points = points;
    });
    $scope.click = () => {

    }
});

console.log((1.32131).toFixed(2));

ipc.on('menu-Save', (event, message) => {
    console.log('saved')
})