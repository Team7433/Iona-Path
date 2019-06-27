
const pathfinder = require('pathfinder1-jaci-js');
const { dialog } = require('electron').remote;
const ipc = require('electron').ipcRenderer;
const fs = require('fs');
const Papa = require('papaparse');
const Sortable = require('sortablejs');
var Client = require('node-ftp');

var angularApp = angular.module("myApp", []);

var canvas = document.getElementById("fieldView");
var ctx = canvas.getContext("2d");

var pntCanvas = document.getElementById("pointsView");
var pntCtx = pntCanvas.getContext("2d");

var fieldWidth = 8.23; //meters
var mToCanvasScaler = canvas.height/fieldWidth;

var points = [];
var pathOptions;

var mouseX;
var mouseY;
var mouseDown;

var userPath;

userPath = ipc.sendSync('get-user-path');

var settingsFile;
try {
  fileContents = fs.readFileSync(userPath + "/user/settings.json");
} catch (err) {
  console.log('No File Found');
  settingsFile = "{}";
}
var settingsData = JSON.parse(settingsFile);

var currentProjectDir = './ExampleProject/'

var pathsInDir = [];

var currentPath;

var changes = false;
var changeIndicator = document.getElementById('changeIndicator');

var projectSettings;


if (fs.existsSync(currentProjectDir + 'settings.json')) {
  var projectSettingsFile = fs.readFileSync(currentProjectDir + 'settings.json');

  projectSettings = JSON.parse(projectSettingsFile);
} else {
  fs.writeFile(currentProjectDir + 'settings.json', JSON.stringify({ 'teamnumber': null, 'wheelBase': 0.7, 'timeStep': 0.02}), (err) => {
    if (err) throw err;
  })
}
console.log(projectSettings);

fs.readdirSync(currentProjectDir + 'Paths/').forEach(file => {
    if (file.indexOf('.json') != -1) {
      var pathContence = fs.readFileSync(currentProjectDir + 'Paths/' + file);
      var pathData = JSON.parse(pathContence);
      pathsInDir.push({
          "fileName": file,
          "name": pathData.Name,
          'enter': true
      });
    }
});

console.log(pathsInDir);

function openPath(path) {
  if (path != null) {
    var newPath = false;
    var currentPathFile;
    try {
      currentPathFile = fs.readFileSync(currentProjectDir + 'Paths/' + path.fileName);
    } catch (err) {
      console.log('No Paths In Project' + err)
      newPath = true;
    }
    var currentPathData;
    if (newPath == false) {
      currentPathData = JSON.parse(currentPathFile);
      points = currentPathData.Points;
      pathOptions = currentPathData.options;
      if (pathOptions == undefined) {
        pathOptions = {
          'velocity': 4.0,
          'acceleration': 3.0,
          'jerk': 5.0
        }
      }
    }
  }
}

if (pathsInDir.length > 0) {
  openPath(pathsInDir[0]);
  pathsInDir[0].selected = true;
  currentPath = pathsInDir[0];
}

function SetChanges(value) {
  changes = value;
  if (changes == false) {
    changeIndicator.style.display = 'none';
  } else {
    changeIndicator.style.display = 'block';
  }
}

var PathTray = false;
var SectionsTray = false;

document.getElementById('pathsDrawHandle').addEventListener('click', () => {
  SetPathTray(!PathTray);
})

document.getElementById('sectionsDrawHandle').addEventListener('click', () => {
  SetSectionsTray(!SectionsTray);
})


function SetPathTray(value) {
  if (value == true) {
    PathTray = true
    SectionsTray = false
    document.getElementById('pathsListBox').style.width = "200px";
    document.getElementById('sectionsListBox').style.width = "0px";
    //document.getElementById('sectionsListBox').style.display = "none"
    //document.getElementById('pathsListBox').style.display = "block"
    document.getElementById('sectionsListBox').style.left = "300px";
    document.getElementById('pathsDrawHandle').style.left = "270px";
    document.getElementById('sectionsDrawHandle').style.left = "300px";
    document.getElementById('paths-box-body').style.display = "block";
    document.getElementById('sections-box-body').style.display = "none";
  } else {
    PathTray = false
    document.getElementById('pathsListBox').style.width = "0px"
    document.getElementById('sectionsListBox').style.width = "0px"
    //document.getElementById('sectionsListBox').style.display = "none"
    //document.getElementById('pathsListBox').style.display = "none"
    document.getElementById('sectionsListBox').style.left = "100px"
    document.getElementById('pathsDrawHandle').style.left = "70px"
    document.getElementById('sectionsDrawHandle').style.left = "100px"
    document.getElementById('paths-box-body').style.display = "none";
    document.getElementById('sections-box-body').style.display = "none";
  }
}

function SetSectionsTray(value) {
  if (value == true) {
    PathTray = false
    SectionsTray = true
    document.getElementById('pathsListBox').style.width = "0px"
    document.getElementById('sectionsListBox').style.width = "200px"
    //document.getElementById('sectionsListBox').style.display = "block"
    //document.getElementById('pathsListBox').style.display = "none"
    document.getElementById('pathsDrawHandle').style.left = "70px"
    document.getElementById('sectionsListBox').style.left = "100px"
    document.getElementById('sectionsDrawHandle').style.left = "300px"
    document.getElementById('sections-box-body').style.display = "block";
    document.getElementById('paths-box-body').style.display = "none";
  } else {
    SectionsTray = false
    document.getElementById('sectionsListBox').style.width = "0px"
    document.getElementById('pathsListBox').style.width = "0px"
    //document.getElementById('sectionsListBox').style.display = "none"
    //document.getElementById('pathsListBox').style.display = "none"
    document.getElementById('pathsDrawHandle').style.left = "70px"
    document.getElementById('sectionsListBox').style.left = "100px"
    document.getElementById('sectionsDrawHandle').style.left = "100px"
    document.getElementById('paths-box-body').style.display = "none";
    document.getElementById('sections-box-body').style.display = "none";
  }
}
document.getElementById('content').addEventListener('mousedown', () => {
  SectionsTray = false
  PathTray = false
  document.getElementById('sectionsListBox').style.width = "0px"
  document.getElementById('pathsListBox').style.width = "0px"
  document.getElementById('pathsDrawHandle').style.left = "70px"
  document.getElementById('sectionsListBox').style.left = "100px"
  document.getElementById('pathsListBox').style.left = "70px"
  document.getElementById('sectionsDrawHandle').style.left = "100px"
  document.getElementById('paths-box-body').style.display = "none";
  document.getElementById('sections-box-body').style.display = "none";
})



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
        pathfinder.generateTank(points.length,points,projectSettings.timeStep,pathOptions.velocity,pathOptions.acceleration,pathOptions.jerk,(length,cntrTraj,leftTraj,rghtTraj) => {
            console.log(length);
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

angularApp.directive('ngFocusout', function () {
  return function (scope, element, attrs) {
    element.bind("focusout", function () {
      scope.$apply(function () {
          scope.$eval(attrs.ngFocusout);
      });
    });
  };
});

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

angularApp.directive('focusOn', function() {
  return function(scope, elem, attr) {
    scope.$watch(attr.focusOn, function(value) {
      setTimeout(() => {
        elem[0].focus();
      }, 150)
    })
  };
});
  

var firstAdd = document.getElementById('firstAdd');

angularApp.controller("myCtrl", function($scope) {
    UpdatePath();
    SetPoints();
    $scope.points = points;
    $scope.paths = pathsInDir;
    $scope.project = projectSettings;
    $scope.options = pathOptions;
    $scope.loaded = false;
    var el = document.getElementById('pointsListSortab');
    var sortable = Sortable.create(el, {
      handle: '.rearrangeHandle',
      animation: 150,
      onEnd: (evt) => {
        points.splice(evt.newIndex, 0, points[evt.oldIndex]);
        points.splice(evt.oldIndex + 1, 1);
        $scope.points = points;
        UpdatePath();
        SetPoints();
        SetChanges(true);
      }
    }); 

    $scope.pointChange = (value) => {
        if (value != null) {
            points = $scope.points;
            SetPoints();
            UpdatePath();
            SetChanges(true)
        }
    }
    document.addEventListener('keydown', (e) => {
      
    })

    $scope.deletePoint = (point) => {
        for (let i = 0; i < points.length; i++) {
            const element = points[i];
            if (point[0] == element[0] &&
                point[1] == element[1] &&
                point[2] == element[2]) {
                points.splice(i, 1);
                SetPoints();
                UpdatePath();
                SetChanges(true)
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
            SetChanges(true);
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
        mouseDown = true;
        mouseX = e.offsetX/mToCanvasScaler;
        mouseY = e.offsetY/mToCanvasScaler;
        for (let i = 0; i < pointHandles.length; i++) {
            if (mouseX < pointHandles[i].CurrentX+0.2 &&
                mouseX > pointHandles[i].CurrentX-0.2 &&
                mouseY < pointHandles[i].CurrentY+0.2 &&
                mouseY > pointHandles[i].CurrentY-0.2
            ){
                pointHandles[i].dragging = true;
            }
            
        }
    });
    pntCanvas.addEventListener("mouseup", (e) => {
        mouseDown = false;
        PointsClear();
        for (let i = 0; i < pointHandles.length; i++) {
            if (pointHandles[i].dragging == true) {
                points[i][0] = Number(pointHandles[i].CurrentX.toFixed(2));
                points[i][1] = Number(pointHandles[i].CurrentY.toFixed(2));
                pointHandles[i].dragging = false;
                SetChanges(true);
            }
        }
        UpdatePath();
        SetPoints();
        $scope.points = points;
    });
    $scope.click = () => {}
    $scope.NewPath = () => {
      for (let i = 0; i < pathsInDir.length; i++) {
        pathsInDir[i].selected = false;
      }
      pathsInDir.push({
        "fileName": null,
        "name": '',
        'enter': false,
        'selected': true,
      })
      points = [];
      UpdatePath();
      SetPoints();
      $scope.points = points;
      $scope.paths = pathsInDir;
    }
    $scope.ChangePathName = (path) => {
      if (path.name == null) {
        path.name = 'untitled'
      }
      if (path.fileName != null) {
        fs.rename(currentProjectDir + 'Paths/' + path.fileName, currentProjectDir + 'Paths/' + path.name + '.json', (err) => {
          if (err) throw err;
          for (let i = 0; i < pathsInDir.length; i++) {
            if (path.fileName == pathsInDir[i].fileName) {
              pathsInDir[i].fileName = path.name + '.json';
              currentPath = pathsInDir[i];
            }
          }
        });
        return path;
      } else {
        var fileData = JSON.stringify({'Points': [], 'Name':path.name})

        fs.writeFileSync(currentProjectDir + 'Paths/' + path.name + '.json', fileData);
        for (let i = 0; i < pathsInDir.length; i++) {
          if (path.fileName == pathsInDir[i].fileName) {
            pathsInDir[i].fileName = path.name + '.json';
            currentPath = pathsInDir[i];
          }
        };
        path.fileName = path.name + '.json';
        openPath(path);
        UpdatePath();
        SetPoints();
        return path;
      }
    }
    $scope.clickPath = (path) => {
      if (path.selected == true) {
        path.selected = true;
        path.enter = false;
      } else {
        for (let i = 0; i < pathsInDir.length; i++) {
          pathsInDir[i].selected = false;
        }
        SetChanges(false);
        openPath(path);
        $scope.paths = pathsInDir;
        $scope.points = points;
        $scope.options = pathOptions;
        UpdatePath();
        SetPoints();
        path.selected = true;
        currentPath = path;
      }
      return path;
    }
    $scope.highlightSelected = (selected) => {
      if (selected == true) {
        return {'background-color': 'gray'};
      } else {
        return {'background-color': 'transparent'}
      }
    }
    $scope.updateProjectSettings = () => {
      projectSettings = $scope.project;
      fs.writeFile(currentProjectDir + 'settings.json', JSON.stringify(projectSettings), (err) => {
        if (err) throw err;
      })
    }
    $scope.updatePathOptionsSettings = () => {
      pathOptions = $scope.options;
      UpdatePath();
      SetChanges(true);
    }
    $scope.testThing = () => {
      var dis = 3;
      var vel = 7;
      var syxErr = false
      try {
        eval($scope.evalString); 
      } catch (e) {
          if (e instanceof SyntaxError || e instanceof ReferenceError) {
              syxErr = true
              console.log(e);
          }
      }
      if (syxErr == false) {
        console.log(eval($scope.evalString));
      }
    }
});

ipc.on('menu-Save', (event, message) => {
  console.log('saved');

  var pathJson = {
      "Points": points,
      "Name": currentPath.name,
      "options": pathOptions
  };
  
  var fileContent = JSON.stringify(pathJson);

  fs.writeFile(currentProjectDir + 'Paths/' + currentPath.fileName, fileContent, 'utf8', (err) => {
      if (err) {
          console.log("An error occured while saving path to File.");
          return console.log(err);
      }
  
      console.log("Path JSON file has been saved.");
      SetChanges(false);
  });
});

ipc.on('menu-Export-Path', (event, message) => {
  dialog.showSaveDialog( {
    "title": "Export",
    "buttonLabel": "Export",
    "filters": [
      { name: "path", extensions: ['csv']},
    ],
    "defaultPath": currentPath.name

  },(filename) => {
    if (filename == null) {
      console.log('exit Export');
    } else {
      pathfinder.generateTank(points.length,points,projectSettings.timeStep,pathOptions.velocity,pathOptions.acceleration,pathOptions.jerk,(pathLength,cntrTraj,leftTraj,rghtTraj) => {
        //console.log(length);
        //console.log(cntrTraj[0]);
        //console.log(cntrTraj);
        //console.log(leftTraj[0]);
        //console.log(rghtTraj);

        var exportArray = [];

        for (let i = 0; i < pathLength; i++) {
          var currentStep = [];
          currentStep[0] = leftTraj[i].distance;
          currentStep[1] = leftTraj[i].velocity;
          currentStep[2] = rghtTraj[i].distance;
          currentStep[3] = rghtTraj[i].velocity;
          exportArray[i] = currentStep
        }

        console.log(exportArray);

        fs.writeFile(filename, Papa.unparse(exportArray, {quotes:false}), (err) => {
          if (err) {
              console.log("An error occured while export path to File.");
              return console.log(err);
          }
        })
      }, (err) => {
        console.log(err);
      });
    }
  })
})

ipc.on('menu-Export', (event, message) => {
  dialog.showSaveDialog( {
    "title": "Export",
    "buttonLabel": "Export",
    "filters": [
      { name: "folder", extensions: ['']},
    ],

  },(folderDir) => {
    if (folderDir == null) {
      console.log('exit Export');
    } else {
      fs.mkdirSync(folderDir);
      fs.readdirSync(currentProjectDir + 'Paths/').forEach(file => {
        console.log(file);
        fs.readFile(currentProjectDir + '/paths/' + file, (err, data) => {
          if (err) throw err;
          var pathJSONData = JSON.parse(data);
          console.log(pathJSONData);
          if (pathJSONData.options == undefined) {
            pathJSONData.options = {
              'velocity': 4.0,
              'acceleration': 3.0,
              'jerk': 5.0
            }
          }
          console.log(pathJSONData.options.velocity);

          pathfinder.generateTank(pathJSONData.Points.length,pathJSONData.Points,projectSettings.timeStep,pathJSONData.options.velocity,pathJSONData.options.acceleration,pathJSONData.options.jerk,(pathLength,cntrTraj,leftTraj,rghtTraj) => {

            var exportArray = [];
    
            for (let i = 0; i < pathLength; i++) {
              var currentStep = [];
              currentStep[0] = leftTraj[i].distance;
              currentStep[1] = leftTraj[i].velocity;
              currentStep[2] = rghtTraj[i].distance;
              currentStep[3] = rghtTraj[i].velocity;
              exportArray[i] = currentStep
            }
            console.log(folderDir + '/' + pathJSONData.Name + ".csv");
            fs.writeFile(folderDir + '/' + pathJSONData.Name + ".csv", Papa.unparse(exportArray, {quotes:false}),(err) => {
              if (err) {throw err} else {
                console.log('Saved File');
              };
            })
    
          }, (err) => {
            console.log(err);
          });
        })
      });
    }
  })
})

ipc.on('menu-Robot', (event, message) => {

})