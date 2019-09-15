# Iona-Path

Iona Path is a UI and all in one tool to generate motion profile paths using [Jaci's Pathfinder](https://github.com/JacisNonsense/Pathfinder) through a Port to [Node.js](https://nodejs.org). Iona Path can generate multiple different paths in a project with different sections in a single path allowing you to go backwards then forwards in the same path. It generates a path for each wheel which is saved into a ```.csv``` file which can be automatically sent to the Robot over FTP

## Getting Started

Download the latest [release](https://github.com/Team7433/Iona-Path/releases)

## Modifing

To build and test you will need [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Install dependencies
npm install

# Run the app
npm start
```

## Packaging

Packaging the app is easy with the eletron packager allready set up

```bash
# Mac
npm run package-mac

# Windows
npm run package-win

# Linix
npm run package-linux
```


To Package a windows version from mac you will need Wine more info can be found here 

