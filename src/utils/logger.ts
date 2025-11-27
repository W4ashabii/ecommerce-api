import { config } from '../config/index.js';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Text colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  
  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
};

const icons = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
  debug: '⚙',
  server: '🚀',
  database: '🗄️',
  config: '⚙️',
  route: '📍',
  auth: '🔐',
  cloud: '☁️',
  time: '⏱️',
};

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDev: boolean;

  constructor() {
    this.isDev = config.nodeEnv === 'development';
  }

  private timestamp(): string {
    return new Date().toISOString();
  }

  private format(level: LogLevel, icon: string, message: string, color: string): string {
    const time = this.isDev 
      ? `${colors.gray}[${this.timestamp()}]${colors.reset} `
      : '';
    return `${time}${color}${icon}${colors.reset} ${message}`;
  }

  // Basic log methods
  info(message: string): void {
    console.log(this.format('info', icons.info, message, colors.blue));
  }

  success(message: string): void {
    console.log(this.format('info', icons.success, message, colors.green));
  }

  warn(message: string): void {
    console.warn(this.format('warn', icons.warning, message, colors.yellow));
  }

  error(message: string, err?: Error): void {
    console.error(this.format('error', icons.error, message, colors.red));
    if (err && this.isDev) {
      console.error(`${colors.dim}${err.stack}${colors.reset}`);
    }
  }

  debug(message: string): void {
    if (this.isDev) {
      console.log(this.format('debug', icons.debug, `${colors.dim}${message}${colors.reset}`, colors.gray));
    }
  }

  // Startup-specific methods
  server(message: string): void {
    console.log(this.format('info', icons.server, `${colors.bright}${message}${colors.reset}`, colors.magenta));
  }

  database(message: string): void {
    console.log(this.format('info', icons.database, message, colors.cyan));
  }

  route(method: string, path: string): void {
    const methodColors: Record<string, string> = {
      GET: colors.green,
      POST: colors.blue,
      PUT: colors.yellow,
      PATCH: colors.yellow,
      DELETE: colors.red,
    };
    const color = methodColors[method] || colors.white;
    console.log(`  ${color}${method.padEnd(7)}${colors.reset} ${path}`);
  }

  auth(message: string): void {
    console.log(this.format('info', icons.auth, message, colors.yellow));
  }

  cloud(message: string): void {
    console.log(this.format('info', icons.cloud, message, colors.cyan));
  }

  // Startup banner
  banner(): void {
    const banner = `
${colors.magenta}${colors.bright}
  ╔═══════════════════════════════════════════════════════╗
  ║                                                       ║
  ║     ${colors.white}AMI E-Commerce API${colors.magenta}                            ║
  ║     ${colors.dim}${colors.white}v1.0.0${colors.reset}${colors.magenta}${colors.bright}                                        ║
  ║                                                       ║
  ╚═══════════════════════════════════════════════════════╝
${colors.reset}`;
    console.log(banner);
  }

  // Startup summary
  startupSummary(data: {
    port: number;
    env: string;
    mongoConnected: boolean;
    cloudinaryConfigured: boolean;
    googleAuthConfigured: boolean;
    adminEmails: string[];
  }): void {
    console.log('');
    console.log(`${colors.bright}${colors.white}  Server Configuration${colors.reset}`);
    console.log(`${colors.gray}  ${'─'.repeat(50)}${colors.reset}`);
    console.log(`  ${colors.cyan}Port:${colors.reset}        ${data.port}`);
    console.log(`  ${colors.cyan}Environment:${colors.reset} ${data.env === 'production' ? colors.red : colors.green}${data.env}${colors.reset}`);
    console.log('');
    
    console.log(`${colors.bright}${colors.white}  Services${colors.reset}`);
    console.log(`${colors.gray}  ${'─'.repeat(50)}${colors.reset}`);
    this.statusLine('MongoDB', data.mongoConnected);
    this.statusLine('Cloudinary', data.cloudinaryConfigured);
    this.statusLine('Google OAuth', data.googleAuthConfigured);
    console.log('');

    if (data.adminEmails.length > 0) {
      console.log(`${colors.bright}${colors.white}  Admin Emails${colors.reset}`);
      console.log(`${colors.gray}  ${'─'.repeat(50)}${colors.reset}`);
      data.adminEmails.forEach(email => {
        console.log(`  ${colors.yellow}${icons.auth}${colors.reset} ${email}`);
      });
      console.log('');
    }

    console.log(`${colors.gray}  ${'─'.repeat(50)}${colors.reset}`);
    console.log(`  ${colors.green}${icons.success} Server ready at ${colors.bright}http://localhost:${data.port}${colors.reset}`);
    console.log('');
  }

  private statusLine(service: string, isConnected: boolean): void {
    const status = isConnected 
      ? `${colors.green}${icons.success} Connected${colors.reset}`
      : `${colors.red}${icons.error} Not configured${colors.reset}`;
    console.log(`  ${service.padEnd(15)} ${status}`);
  }

  // Request logging
  request(method: string, path: string, status: number, duration: number): void {
    const statusColor = status >= 500 ? colors.red 
      : status >= 400 ? colors.yellow 
      : status >= 300 ? colors.cyan 
      : colors.green;
    
    const methodColors: Record<string, string> = {
      GET: colors.green,
      POST: colors.blue,
      PUT: colors.yellow,
      PATCH: colors.yellow,
      DELETE: colors.red,
    };
    const methodColor = methodColors[method] || colors.white;
    
    console.log(
      `${colors.gray}[${this.timestamp()}]${colors.reset} ` +
      `${methodColor}${method.padEnd(7)}${colors.reset} ` +
      `${path.padEnd(40)} ` +
      `${statusColor}${status}${colors.reset} ` +
      `${colors.dim}${duration}ms${colors.reset}`
    );
  }

  // Divider
  divider(): void {
    console.log(`${colors.gray}${'─'.repeat(60)}${colors.reset}`);
  }

  // Section header
  section(title: string): void {
    console.log('');
    console.log(`${colors.bright}${colors.cyan}▸ ${title}${colors.reset}`);
  }
}

export const logger = new Logger();

