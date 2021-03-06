import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
// import { LedgerEntriesService } from './ledger-entries.service'
import { LedgerEntry } from './ledger-entry.entity'
import { LedgerEntriesService } from './ledger-entries.service'
import { LedgerEntriesController } from './ledger-entries.controller'

@Module({
    imports: [TypeOrmModule.forFeature([LedgerEntry])],
    providers: [LedgerEntriesService],
    exports: [TypeOrmModule, LedgerEntriesService],
    controllers: [LedgerEntriesController],
})
export class LedgerEntriesModule { }
