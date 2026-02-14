const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onConnectionUpdate: (callback) => ipcRenderer.on('connection-update', (event, data) => callback(data)),
  onStrokeCompleted: (callback) => ipcRenderer.on('stroke-completed', () => callback()),
  onFinished: (callback) => ipcRenderer.on('finished', () => callback()),
  onDrawingStats: (callback) => ipcRenderer.on('drawing-stats', (event, data) => callback(data)),

  upload: () => ipcRenderer.invoke('upload'),

  openSettings: () => ipcRenderer.invoke('open-settings'),
  settingsServoTest: (val) => ipcRenderer.invoke('settings-servo-test', val),
  settingsOk: (settings) => ipcRenderer.invoke('settings-ok', settings),
  settingsCancel: () => ipcRenderer.invoke('settings-cancel'),

  openInfo: () => ipcRenderer.invoke('open-info'),
  infoOk: () => ipcRenderer.invoke('info-ok'),
  infoOpenGithub: (url) => ipcRenderer.invoke('info-open-github', url),

  start: () => ipcRenderer.invoke('start'),
  pause: () => ipcRenderer.invoke('pause'),
  stop: () => ipcRenderer.invoke('stop'),
})

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})