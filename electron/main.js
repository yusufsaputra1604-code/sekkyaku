const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let serverProcess;

function getBasePath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app');
  }
  return path.join(__dirname, '..');
}

function startServer() {
  const basePath = getBasePath();
  const serverPath = path.join(basePath, 'server', 'src', 'index.js');
  const serverDir = path.join(basePath, 'server');

  const dbDir = path.join(process.resourcesPath, 'server', 'prisma');
  const uploadsDir = path.join(process.resourcesPath, 'server', 'uploads');

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const env = {
    ...process.env,
    NODE_ENV: 'production',
    DATABASE_URL: `file:${path.join(dbDir, 'dev.db')}`,
    UPLOADS_PATH: uploadsDir,
  };

  console.log('Starting server from:', serverPath);
  console.log('Database path:', path.join(dbDir, 'dev.db'));

  serverProcess = spawn('node', [serverPath], {
    cwd: serverDir,
    stdio: 'pipe',
    env,
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
  });

  return new Promise((resolve) => {
    setTimeout(resolve, 3000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'Sekkyaku',
    show: false,
  });

  mainWindow.loadURL('http://localhost:5000');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await startServer();
  createWindow();
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
