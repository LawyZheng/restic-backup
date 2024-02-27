import { execFileSync, execFile, ChildProcess } from 'child_process'

interface setting {
    resticBin: string;
	repo: string;
	password: string;
}

export class ResticBinary {
    binPath: string;
    env: NodeJS.ProcessEnv;

    constructor(bin: string) {
        this.binPath = bin
        this.env = process.env
	}

    private setEnv(key: string, value: string) {
        this.env[key] = value
    }

    password(passwd: string): ResticBinary {
        this.setEnv('RESTIC_PASSWORD', passwd)
        return this
    }

    repository(repo: string): ResticBinary {
        this.setEnv('RESTIC_REPOSITORY', repo)
        return this
    }

    version(): string {
        const buf = this.runSync(['version'])
        return buf.toString()
    }

    run(args: string[]): ChildProcess {
        let p : ChildProcess
        try {
            p = execFile(
                this.binPath,
                args,
                {
                    env: this.env,
                }
            )
        } catch (error) {
            console.error(error)
            throw error
        }
        return p
    }

    runSync(args: string[]): Buffer {
        let buf: Buffer
        try {
            buf = execFileSync(
                this.binPath,
                args,
                {
                    env: this.env,
                }
            )
        } catch (error) {
            console.error(error)
            throw error
        }
        return buf
    }
}

export class Restic {
    vaultPath: string;
    bin: ResticBinary
    // config: ResticSettings;

    constructor( config: setting, vaultPath: string) {
        if (!config.repo) {
            throw "empty repo"
        }

        if (!config.password) {
            throw "empty password"
        }

        if (!config.resticBin) {
            throw "empty restic bin"
        }

        this.vaultPath = vaultPath
        this.bin = new ResticBinary(config.resticBin)
                        .password(config.password)
                        .repository(config.repo)
	}

    init(): void {
        this.bin.run(['init'])
    }

    backup(): void {
        this.bin.run(['backup', this.vaultPath])
    }

    version(): string {
        return this.bin.version()
    }

}
