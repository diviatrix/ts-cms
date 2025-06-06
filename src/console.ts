import messages from './data/messages';
import config from './data/config';
import commands from './data/commands';

export default class Console {
    private inputHandler: (data: Buffer) => void;
    private currentInput: string = '';

    constructor() {
        this.inputHandler = this.handleInput.bind(this);
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', this.inputHandler);

        // Autocomplete support
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
            process.stdin.on('keypress', this.handleKeyPress.bind(this));
        }

        this.showPrompt();
    }

    // Handle input data from stdin
    private handleInput(data: Buffer): void {
        const input = data.toString().trim();

        // Process the command
        Console.matchInput(input).then(() => {
            this.showPrompt();
            process.stdin.resume();
        }).catch(error => {
            console.error("Error executing command:", error);
            this.showPrompt();
            process.stdin.resume();
        });
    }

    // Handle keypress for autocomplete
    private handleKeyPress(chunk: Buffer, key?: any): void {
        const char = chunk.toString();
        if (char === '\t') { // Tab key
            const matches = Object.keys(commands).filter(cmd => cmd.startsWith(this.currentInput));
            if (matches.length === 1) {
                // Autocomplete to the single match
                this.currentInput = matches[0];
                this.refreshLine();
            } else if (matches.length > 1) {
                process.stdout.write('\n' + matches.join(' ') + '\n');
                this.showPrompt();
                process.stdout.write(this.currentInput);
            }
        } else if (char === '\r' || char === '\n') { // Enter key
            process.stdout.write('\n');
            process.stdin.emit('data', Buffer.from(this.currentInput + '\n'));
            this.currentInput = '';
        } else if (char === '\u0003') { // Ctrl+C
            process.exit();
        } else if (char === '\u007f') { // Backspace
            if (this.currentInput.length > 0) {
                this.currentInput = this.currentInput.slice(0, -1);
                this.refreshLine();
            }
        } else if (char >= ' ' && char <= '~') { // Printable characters
            this.currentInput += char;
            process.stdout.write(char);
        }
    }

    // Refresh the current input line
    private refreshLine(): void {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        this.showPrompt();
        process.stdout.write(this.currentInput);
    }

    // Display the prompt
    private showPrompt(): void {
        process.stdout.write(messages.console_input);
    }

    // Clean up when shutting down
    public close(): void {
        process.stdin.removeListener('data', this.inputHandler);
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
            process.stdin.removeAllListeners('keypress');
        }
        process.stdin.pause();
    }

    // Static method for one-time input reading
    public static async readInput(prompt: string): Promise<string> {
        return new Promise((resolve) => {
            const onceHandler = (data: Buffer) => {
                const input = data.toString().trim();
                process.stdin.removeListener('data', onceHandler);
                resolve(input);
            };

            process.stdout.write(prompt);
            process.stdin.resume();
            process.stdin.once('data', onceHandler);
        });
    }

    // Read input with params
    public static async readInputWithParams(prompt: string, params: any): Promise<string> {
        return Console.readInput(prompt); // Parameters not used in implementation
    }

    // Match input with command
    public static async matchInput(input: string): Promise<void> {
        if (input in commands) {
            console.log(`Executing command: ${input}`);
            if (typeof Console.prototype[input as keyof Console] === 'function') {
                const consoleInstance = new Console();
                await (consoleInstance[input as keyof Console] as Function)();
                consoleInstance.close();
            } else {
                console.warn(`Method for command ${input} not found`);
            }
        }
        else {
            console.log(`Command "${input}" not found`);
        }
    }

    public async help(): Promise<void> {
        console.log("---------HELP COMMANDS---------");
        console.log("Available commands:");
        for (const command in commands) {
            console.log(`${command}: ${commands[command as keyof typeof commands]}`);
        }
    }

    public async config(): Promise<void> {
        console.log("Current configuration:");
        console.log(JSON.stringify(config, null, 2));
    }

    public async status(): Promise<void> {
        console.log("Server status:");
        console.log("Static server running at " + config.origin);
        console.log("API server running at " + config.api_address + ":" + config.api_port + config.api_suffix);
    }
}

// Add keypress event support for Node.js
if (process.stdin.isTTY && typeof (process.stdin as any).setRawMode === 'function') {
    const readline = require('readline');
    readline.emitKeypressEvents(process.stdin);
}
