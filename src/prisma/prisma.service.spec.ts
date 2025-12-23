import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should extend PrismaClient', () => {
    expect(service).toBeInstanceOf(PrismaClient);
  });

  it('should implement OnModuleInit interface', () => {
    expect(service).toHaveProperty('onModuleInit');
    expect(typeof service.onModuleInit).toBe('function');
  });

  it('should implement OnModuleDestroy interface', () => {
    expect(service).toHaveProperty('onModuleDestroy');
    expect(typeof service.onModuleDestroy).toBe('function');
  });

  it('should call $connect when onModuleInit is called', async () => {
    const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();
    
    await service.onModuleInit();
    
    expect(connectSpy).toHaveBeenCalledTimes(1);
    connectSpy.mockRestore();
  });

  it('should call $disconnect when onModuleDestroy is called', async () => {
    const disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValue();
    
    await service.onModuleDestroy();
    
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
    disconnectSpy.mockRestore();
  });

  it('should have $connect method from PrismaClient', () => {
    expect(service).toHaveProperty('$connect');
    expect(typeof service.$connect).toBe('function');
  });

  it('should have $disconnect method from PrismaClient', () => {
    expect(service).toHaveProperty('$disconnect');
    expect(typeof service.$disconnect).toBe('function');
  });
});