import { execFile, PromiseWithChild } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'

const execFileAsync = promisify(execFile)

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

    isExist(repo: string): boolean {
        return fs.existsSync(repo)
    }

    createFolder(repo: string): void {
        fs.mkdirSync(repo, {recursive: true})
    }

    isEmpty(repo: string): boolean {
        const files = fs.readdirSync(repo) 
        return files.length == 0
    }

    isRepo(repo: string): boolean {
        if (!fs.existsSync(path.join(repo, 'config'))){
            return false
        }

        const targets: string[] = ['data', 'index', 'keys', 'locks', 'snapshots']
        for(let i=0; i<targets.length; i++) {
            if (!fs.existsSync(path.join(repo, targets[i]))) {
                return false
            }
        }

        return true
    }

    exec(args: string[]): PromiseWithChild<{stdout: string, stderr: string}> {
        return execFileAsync(
            this.binPath, 
            args, 
            {
                env: this.env,
            },
        )
    }

    async execWithStdout(args: string[]): Promise<string> {
        try {
            const {stdout, stderr} = await this.exec(args)
            if (stderr) {
                console.error(stderr)
            }
            return stdout
        } catch (error) {
            console.error(error)
            throw error
        }
    }

    async version(): Promise<string> {
        const stdout = await this.execWithStdout(['version'])
        if (!stdout.startsWith('restic')){
            throw 'wrong executable binary'
        }
        return stdout

    }
}

export class Restic {
    private vaultPath: string;
    private bin: ResticBinary
    private setting: setting

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

        if (!vaultPath) {
            throw "empty vault path"
        }

        this.vaultPath = vaultPath
        this.setting = config
        this.bin = new ResticBinary(config.resticBin)
                        .password(config.password)
                        .repository(config.repo)
	}

    async init(): Promise<void> {
        await this.bin.execWithStdout(['init'])
    }

    async initIfEmpty(): Promise<void> {
        const repo = this.setting.repo

        if (this.bin.isEmpty(repo)) {
            return this.init()
        }

        if (this.bin.isRepo(repo)) {
            return
        }

        throw 'path is not a repository'
    }

    async backup(): Promise<void> {
        await this.bin.execWithStdout(['backup', this.vaultPath])
    }

    async version(): Promise<string> {
        return this.bin.version()
    }

    findFileInSnapshots(file: string): {
    }

    isRepo(): boolean {
        return this.bin.isRepo(this.setting.repo)
    }

}
