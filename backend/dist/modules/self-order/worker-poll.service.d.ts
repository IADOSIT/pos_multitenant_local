import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { MenuDigitalConfig } from '../menu-digital/entities/menu-digital-config.entity';
import { SelfOrderService } from './self-order.service';
export declare class WorkerPollService implements OnModuleInit, OnModuleDestroy {
    private cfgRepo;
    private selfOrderService;
    private dataSource;
    private readonly logger;
    private timer;
    private polling;
    constructor(cfgRepo: Repository<MenuDigitalConfig>, selfOrderService: SelfOrderService, dataSource: DataSource);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private poll;
    private pollOne;
    private pollSlug;
}
