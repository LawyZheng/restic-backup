import { execFile, PromiseWithChild } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'

import { Match, Snapshot } from './type'

const execFileAsync = promisify(execFile)
const writeFileAsync = promisify(fs.writeFile)

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

    exec(args: string[]): PromiseWithChild<{stdout: Buffer, stderr: Buffer}> {
        return execFileAsync(
            this.binPath, 
            args, 
            {
                encoding: 'buffer',
                env: this.env,
            },
        )
    }

    async execWithBuffer(args: string[]): Promise<Buffer> {
        try {
            const {stdout, stderr} = await this.exec(args)
            if (stderr.toString()) {
                console.error(stderr.toString())
            }
            return stdout
        } catch (error) {
            console.error(error)
            throw error
        }
    }

    async execWithStdout(args: string[]): Promise<string> {
        try {
            const {stdout, stderr} = await this.exec(args)
            if (stderr.toString()) {
                console.error(stderr.toString())
            }
            return stdout.toString()
        } catch (error) {
            console.error(error)
            throw error
        }
    }

    async execWithType<T>(args: string[]): Promise<T> {
        const stdout = await this.execWithStdout(args)
        const data: T = JSON.parse(stdout)
        return data
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

    async findFileInSnapshots(pattern: string, snapshot_ids?: string[]): Promise<Match[]> {
        if (pattern.startsWith('-')) {
            pattern = '\\' + pattern
        }

        const args: string[] = ['--json', 'find', pattern]
        for(let i=0; snapshot_ids && i < snapshot_ids.length; i++ ) {
            args.push('--snapshot', snapshot_ids[i])
        }
        const data = await this.bin.execWithType<Match[]>(args)
        data.reverse()
        return data
    }

    async getSnapshotById(... ids: string[]): Promise<Snapshot|null> {
        if (!ids) {
            return null
        }
        const args: string[] = ['--json', 'snapshots', ...ids]
        const data: Snapshot[] = await this.bin.execWithType<Snapshot[]>(args)
        if (!data){
            return null
        }
        return data[0]
    }

    // use 'restic dump'
    async restoreFile(snapshotId: string, src: string, dst: string) {
        const buffer = await this.bin.execWithBuffer(['dump', snapshotId, src])
        await writeFileAsync(dst, buffer)
    }
    
    getCurrentVault():string {
        return this.vaultPath
    }

    isRepo(): boolean {
        return this.bin.isRepo(this.setting.repo)
    }

}
