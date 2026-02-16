const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron/main');
const path = require('node:path')
const fs = require('fs');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { SvgToGcodeConvertor } = require("./svgToGcode");
const { DOMParser } = require('@xmldom/xmldom')
const EventEmitter = require('node:events');
const eventEmitter = new EventEmitter();

var Slicer = {
	vendorId: "1a86",
	productId: "7523",

	wasConnected: false,
	isConnected: false,
	port: null,
	parser: null,
	devicePath: "",
	isDrawing: false,
	isPaused: false,
	pathData: "",
	gcode: "",

	windows: {
		main: null,
		settings: null,
		info: null
	},

	settings: {
		topAngle: 130,
		bottomAngle: 70,
		originOffsetX: 0,
		originOffsetY: 0,
		acceleration: 200
	},

	init: function() {
		this.bindEvents();
		this.createMainWindow();

		setInterval(() => {
			this.checkConnection();
		}, 1000);
	},

	bindEvents: function() {
		ipcMain.handle('upload', this.onUpload.bind(this));
		ipcMain.handle('open-settings', this.onOpenSettings.bind(this));
		ipcMain.handle('settings-servo-test', this.onSettingsServoTest.bind(this));
		ipcMain.handle('settings-ok', this.onSettingsOk.bind(this));
		ipcMain.handle('settings-cancel', this.onSettingsCancel.bind(this));
		ipcMain.handle('open-info', this.onOpenInfo.bind(this));
		ipcMain.handle('info-ok', this.onInfoOk.bind(this));
		ipcMain.handle('info-open-github', this.onInfoOpenGithub.bind(this));
		ipcMain.handle('start', this.onStart.bind(this));
		ipcMain.handle('pause', this.onPause.bind(this));
		ipcMain.handle('stop', this.onStop.bind(this));
	},

	onUpload: function(event) {
		return this.getFile();
	},

	onOpenSettings: function(event) {
		this.createSettingsWindow();
	},

	onSettingsServoTest: function(event, angle) {
		this.testServo(angle);
	},

	onSettingsOk: function(event, settings) {
		this.updateSettings(settings);
		this.destroySettingsWindow();
	},

	onSettingsCancel: function(event) {
		this.destroySettingsWindow();
	},

	onOpenInfo: function(event) {
		this.createInfoWindow();
	},

	onInfoOk: function(event) {
		this.destroyInfoWindow();
	},

	onInfoOpenGithub: function(event, url) {
		this.openURL(url);
	},

	onStart: function(event) {
		this.start();
	},

	onPause: function(event) {
		this.pause();
	},

	onStop: function(event) {
		this.stop();
	},

	createMainWindow: function() {
		this.windows.main = new BrowserWindow({
			width: 800,
			height: 580,
			resizable: false,
			webPreferences: {
				preload: path.join(__dirname, "preload.js"),
				contextIsolation: true,
				nodeIntegration: false,
			}
		});

		this.windows.main.loadFile(path.join(__dirname, "..", "html/index.html"));
	},

	createSettingsWindow: function() {
		this.windows.settings = new BrowserWindow({
			parent: this.windows.main,
			modal: true,
			titleBarStyle: 'hiddenInset',
			width: 300,
			height: 350,
			resizable: false,
			webPreferences: {
				preload: path.join(__dirname, 'preload.js'),
				contextIsolation: true,
				nodeIntegration: false,
			}
		});

		this.windows.settings.loadFile(path.join(__dirname, "..", "html/settings.html"), {
			query: {
				topAngle: this.settings.topAngle,
				bottomAngle: this.settings.bottomAngle,
				originOffsetX: this.settings.originOffsetX,
				originOffsetY: this.settings.originOffsetY,
				acceleration: this.settings.acceleration,
			},
		});
	},

	destroySettingsWindow: function() {
		this.windows.settings.close();
	},

	createInfoWindow: function() {
		this.windows.info = new BrowserWindow({
			parent: this.windows.main,
			modal: true,
			titleBarStyle: 'hiddenInset',
			width: 300,
			height: 200,
			resizable: false,
			webPreferences: {
				preload: path.join(__dirname, 'preload.js'),
				contextIsolation: true,
				nodeIntegration: false,
			}
		});

		this.windows.info.loadFile(path.join(__dirname, "..", "html/info.html"));
	},

	destroyInfoWindow: function() {
		this.windows.info.close();
	},

	getFile: function() {
		var res = dialog.showOpenDialogSync({
			properties: ['openFile'],
			filters: [
				{
					name: 'Images',
					extensions: ['svg']
				}
			]
		});

		var data = "";

		if (typeof res !== "undefined") {
			data = fs.readFileSync(res[0], 'utf-8');

			data = data.replaceAll(
				/stroke\s*:\s*[^"]*/g,
				'stroke:#5dfffc'
			);

			// data = data.replaceAll(
			// 	/fill\s*:\s*(?!none\b)[^;"]*/gi,
			// 	'fill:#5dfffc'
			// );

			var doc = new DOMParser().parseFromString(data, 'text/xml');
			this.pathData = doc.getElementsByTagName("path")[0].getAttribute("d");
		}

		return {
			data: data,
		};
	},

	openURL: function(url) {
		shell.openExternal(url);
	},

	sendCommand: function(command) {
		this.port.write(command + "\n");

		return new Promise((resolve) => {
			this.parser.once("data", (data) => {
				console.log(data);
				
				resolve();
			});
		});
	},

	checkConnection: function() {
		SerialPort.list().then((devices) => {
			for (let i = 0; i < devices.length; i++) {					
				if (devices[i].vendorId && devices[i].productId && devices[i].vendorId.toLowerCase() == this.vendorId && devices[i].productId == this.productId) {
					this.devicePath = devices[i].path;

					this.wasConnected = this.isConnected;
					this.isConnected = true;

					if (this.wasConnected != this.isConnected) {
						this.port = new SerialPort({
							path: this.devicePath,
							baudRate: 115200
						});
						this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));
					}

					this.windows.main.webContents.send('connection-update', true);
					return;
				}
			}

			this.devicePath = "";
			this.port = null;
			this.parser = null;
			this.isConnected = false;

			this.windows.main.webContents.send('connection-update', false);
		}).catch((err) => {
			console.log(err);
		});
	},

	updateSettings: function(settings) {
		this.settings.topAngle = settings.topAngle;
		this.settings.bottomAngle = settings.bottomAngle;
		this.settings.originOffsetX = settings.originOffsetX;
		this.settings.originOffsetY = settings.originOffsetY;
		this.settings.acceleration = settings.acceleration;
	},

	testServo: async function(angle) {
		await this.sendCommand("$X");
		await this.sendCommand(angle == 0 ? "M5" : `M3 s${angle}`);
	},

	start: function() {
		if (this.isDrawing) {
			this.isPaused = false;
			eventEmitter.emit("resumed");
			return;
		}

		this.isDrawing = true;
		this.isPaused = false;
		this.draw();
	},

	pause: function() {
		this.isPaused = true;
	},

	stop: function() {
		this.isDrawing = false;
		this.isPaused = false;
	},

	draw: async function() {
		this.gcode = SvgToGcodeConvertor.convert(this.pathData, this.settings);
		fs.writeFileSync('test.txt', this.gcode);

		var gcodeArr = this.gcode.split("\n");

		await this.sendCommand(`$120=${this.settings.acceleration}`);
		await this.sendCommand(`$121=${this.settings.acceleration}`);
		await this.sendCommand('$X');
		await this.sendCommand(`M3 s${this.settings.topAngle}`);
		await this.sendCommand('$H');
		await this.sendCommand('G4 P0');
		await this.sendCommand('G92 X0 Y0');
		await this.sendCommand(`G0 X${this.settings.originOffsetX+1} Y${this.settings.originOffsetY}`);
		await this.sendCommand('G4 P0');
		await this.sendCommand('G92 X0 Y0');

		await dialog.showMessageBox(this.windows.main, {
			'type': 'info',
			'title': 'Setup',
			'message': "Secure the drawing surface using magnets to continue",
			'buttons': [
				'Done'
			]
		});

		this.windows.main.webContents.send('drawing-stats', {
			strokes: (this.gcode.match(new RegExp(`M3 s${this.settings.topAngle}`, "g")) || []).length,
			estTime: SvgToGcodeConvertor.estTime*1.75
		});

		for (let i = 0; i < gcodeArr.length; i++) {
			if (!this.isDrawing) {
				break;
			}

			if (!this.isPaused) {
				await this.sendCommand(gcodeArr[i]);

				console.log(gcodeArr[i]);

				if (gcodeArr[i] == `M3 s${this.settings.topAngle}`) {
					this.windows.main.webContents.send('stroke-completed');
				}
				continue;
			}

			await new Promise((resolve) => {
				eventEmitter.once('resumed', () => {
					resolve();
				});
			});
		}

		await this.sendCommand(`M3 s${this.settings.topAngle}\n`);
		await this.sendCommand(`G0 X0 Y0`);

		await dialog.showMessageBox(this.windows.main, {
			'type': 'info',
			'title': 'Finished',
			'message': "Drawing finished, remove the magnets and drawing surface",
			'buttons': [
				'Done'
			]
		});

		this.windows.main.webContents.send('finished');

		this.isDrawing = false;
		this.isPaused = false;
	}
};

app.whenReady().then(() => {
	Slicer.init();
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
});