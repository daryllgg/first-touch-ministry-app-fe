# Pledges/Giving Module Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a PIN-protected pledges/giving tracking system with programs (Seed Faith, Faith Pledge, Custom), pledge management, payment recording, and analytics dashboard.

**Architecture:** Program-Centric model — `GivingProgram → Pledge → PledgePayment`. Separate `UserPin` entity for PIN-based access control. Backend is NestJS with TypeORM + PostgreSQL. Frontend is Angular 18 + Ionic 8 with platform-aware rendering (`isWeb` flag). Admin/Pastor roles manage data; all users view their own pledges behind PIN.

**Tech Stack:** NestJS 11, TypeORM, PostgreSQL, Angular 18, Ionic 8, bcrypt, class-validator

**Design Doc:** `docs/plans/2026-03-07-pledges-giving-module-design.md`

---

## Phase 1: Backend — Entities & Enums

### Task 1: Create enums for giving module

**Files:**
- Create: `church-app-api/src/pledges/entities/program-type.enum.ts`
- Create: `church-app-api/src/pledges/entities/payment-method.enum.ts`

**Step 1: Create ProgramType enum**

```typescript
// church-app-api/src/pledges/entities/program-type.enum.ts
export enum ProgramType {
  SEED_FAITH = 'SEED_FAITH',
  FAITH_PLEDGE = 'FAITH_PLEDGE',
  CUSTOM = 'CUSTOM',
}
```

**Step 2: Create PaymentMethod enum**

```typescript
// church-app-api/src/pledges/entities/payment-method.enum.ts
export enum PaymentMethod {
  CASH = 'CASH',
  GCASH = 'GCASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  OTHER = 'OTHER',
}
```

**Step 3: Commit**

```bash
git add src/pledges/entities/program-type.enum.ts src/pledges/entities/payment-method.enum.ts
git commit -m "feat(pledges): add ProgramType and PaymentMethod enums"
```

---

### Task 2: Create GivingProgram entity

**Files:**
- Create: `church-app-api/src/pledges/entities/giving-program.entity.ts`

**Step 1: Create entity**

```typescript
// church-app-api/src/pledges/entities/giving-program.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ProgramType } from './program-type.enum';

@Entity('giving_programs')
export class GivingProgram {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ProgramType })
  type: ProgramType;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column({ nullable: true, type: 'date' })
  startDate: string | null;

  @Column({ nullable: true, type: 'date' })
  endDate: string | null;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User, { eager: true })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Step 2: Commit**

```bash
git add src/pledges/entities/giving-program.entity.ts
git commit -m "feat(pledges): add GivingProgram entity"
```

---

### Task 3: Create Pledge entity

**Files:**
- Create: `church-app-api/src/pledges/entities/pledge.entity.ts`

**Step 1: Create entity**

```typescript
// church-app-api/src/pledges/entities/pledge.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  OneToMany, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { GivingProgram } from './giving-program.entity';
import { PledgePayment } from './pledge-payment.entity';

@Entity('pledges')
export class Pledge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @ManyToOne(() => GivingProgram, { eager: true })
  program: GivingProgram;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  pledgeAmount: number;

  @Column({ nullable: true })
  totalMonths: number | null;

  @Column({ nullable: true, type: 'date' })
  startMonth: string | null;

  @Column({ nullable: true, type: 'text' })
  notes: string | null;

  @ManyToOne(() => User, { eager: true })
  createdBy: User;

  @OneToMany(() => PledgePayment, (payment) => payment.pledge, {
    cascade: true,
    eager: true,
  })
  payments: PledgePayment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Step 2: Commit**

```bash
git add src/pledges/entities/pledge.entity.ts
git commit -m "feat(pledges): add Pledge entity"
```

---

### Task 4: Create PledgePayment entity

**Files:**
- Create: `church-app-api/src/pledges/entities/pledge-payment.entity.ts`

**Step 1: Create entity**

```typescript
// church-app-api/src/pledges/entities/pledge-payment.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Pledge } from './pledge.entity';
import { PaymentMethod } from './payment-method.enum';

@Entity('pledge_payments')
export class PledgePayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Pledge, (pledge) => pledge.payments, { onDelete: 'CASCADE' })
  pledge: Pledge;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ nullable: true, type: 'date' })
  month: string | null;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({ nullable: true, type: 'text' })
  notes: string | null;

  @ManyToOne(() => User, { eager: true })
  recordedBy: User;

  @CreateDateColumn()
  createdAt: Date;
}
```

**Step 2: Commit**

```bash
git add src/pledges/entities/pledge-payment.entity.ts
git commit -m "feat(pledges): add PledgePayment entity"
```

---

### Task 5: Create UserPin entity

**Files:**
- Create: `church-app-api/src/pledges/entities/user-pin.entity.ts`

**Step 1: Create entity**

```typescript
// church-app-api/src/pledges/entities/user-pin.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from '../../users/entities/user.entity';

@Entity('user_pins')
export class UserPin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  @Exclude()
  pinHash: string;

  @Column({ default: 0 })
  failedAttempts: number;

  @Column({ nullable: true, type: 'timestamp' })
  lockedUntil: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Step 2: Commit**

```bash
git add src/pledges/entities/user-pin.entity.ts
git commit -m "feat(pledges): add UserPin entity"
```

---

## Phase 2: Backend — DTOs

### Task 6: Create DTOs for giving programs, pledges, payments, and PIN

**Files:**
- Create: `church-app-api/src/pledges/dto/create-giving-program.dto.ts`
- Create: `church-app-api/src/pledges/dto/update-giving-program.dto.ts`
- Create: `church-app-api/src/pledges/dto/create-pledge.dto.ts`
- Create: `church-app-api/src/pledges/dto/update-pledge.dto.ts`
- Create: `church-app-api/src/pledges/dto/create-payment.dto.ts`
- Create: `church-app-api/src/pledges/dto/update-payment.dto.ts`
- Create: `church-app-api/src/pledges/dto/setup-pin.dto.ts`
- Create: `church-app-api/src/pledges/dto/verify-pin.dto.ts`
- Create: `church-app-api/src/pledges/dto/change-pin.dto.ts`

**Step 1: Create GivingProgram DTOs**

```typescript
// church-app-api/src/pledges/dto/create-giving-program.dto.ts
import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ProgramType } from '../entities/program-type.enum';

export class CreateGivingProgramDto {
  @IsString()
  name: string;

  @IsEnum(ProgramType)
  type: ProgramType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
```

```typescript
// church-app-api/src/pledges/dto/update-giving-program.dto.ts
import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ProgramType } from '../entities/program-type.enum';

export class UpdateGivingProgramDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(ProgramType)
  type?: ProgramType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

**Step 2: Create Pledge DTOs**

```typescript
// church-app-api/src/pledges/dto/create-pledge.dto.ts
import { IsUUID, IsNumber, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class CreatePledgeDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  programId: string;

  @IsNumber()
  @Min(0)
  pledgeAmount: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalMonths?: number;

  @IsOptional()
  @IsString()
  startMonth?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

```typescript
// church-app-api/src/pledges/dto/update-pledge.dto.ts
import { IsNumber, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class UpdatePledgeDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  pledgeAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalMonths?: number;

  @IsOptional()
  @IsString()
  startMonth?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

**Step 3: Create Payment DTOs**

```typescript
// church-app-api/src/pledges/dto/create-payment.dto.ts
import { IsNumber, IsString, IsOptional, IsEnum, Min } from 'class-validator';
import { PaymentMethod } from '../entities/payment-method.enum';

export class CreatePaymentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  month?: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

```typescript
// church-app-api/src/pledges/dto/update-payment.dto.ts
import { IsNumber, IsString, IsOptional, IsEnum, Min } from 'class-validator';
import { PaymentMethod } from '../entities/payment-method.enum';

export class UpdatePaymentDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  month?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

**Step 4: Create PIN DTOs**

```typescript
// church-app-api/src/pledges/dto/setup-pin.dto.ts
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class SetupPinDto {
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  @Matches(/^\d+$/, { message: 'PIN must contain only digits' })
  pin: string;
}
```

```typescript
// church-app-api/src/pledges/dto/verify-pin.dto.ts
import { IsString } from 'class-validator';

export class VerifyPinDto {
  @IsString()
  pin: string;
}
```

```typescript
// church-app-api/src/pledges/dto/change-pin.dto.ts
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ChangePinDto {
  @IsString()
  currentPin: string;

  @IsString()
  @MinLength(4)
  @MaxLength(6)
  @Matches(/^\d+$/, { message: 'PIN must contain only digits' })
  newPin: string;
}
```

**Step 5: Commit**

```bash
git add src/pledges/dto/
git commit -m "feat(pledges): add all DTOs for programs, pledges, payments, and PIN"
```

---

## Phase 3: Backend — Services

### Task 7: Create PinService

**Files:**
- Create: `church-app-api/src/pledges/pin.service.ts`

**Step 1: Create PinService**

```typescript
// church-app-api/src/pledges/pin.service.ts
import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserPin } from './entities/user-pin.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PinService {
  constructor(
    @InjectRepository(UserPin)
    private pinRepo: Repository<UserPin>,
  ) {}

  async hasPin(user: User): Promise<boolean> {
    const pin = await this.pinRepo.findOne({ where: { user: { id: user.id } } });
    return !!pin;
  }

  async setup(user: User, pin: string): Promise<{ success: boolean }> {
    const existing = await this.pinRepo.findOne({ where: { user: { id: user.id } } });
    if (existing) {
      throw new BadRequestException('PIN already set. Use change endpoint.');
    }
    const pinHash = await bcrypt.hash(pin, 10);
    const userPin = this.pinRepo.create({ user, pinHash });
    await this.pinRepo.save(userPin);
    return { success: true };
  }

  async verify(user: User, pin: string): Promise<{ verified: boolean }> {
    const userPin = await this.pinRepo.findOne({ where: { user: { id: user.id } } });
    if (!userPin) {
      throw new BadRequestException('PIN not set. Use setup endpoint first.');
    }

    // Check lockout
    if (userPin.lockedUntil && userPin.lockedUntil > new Date()) {
      const minutes = Math.ceil((userPin.lockedUntil.getTime() - Date.now()) / 60000);
      throw new ForbiddenException(`Too many attempts. Try again in ${minutes} minute(s).`);
    }

    const isValid = await bcrypt.compare(pin, userPin.pinHash);
    if (!isValid) {
      userPin.failedAttempts += 1;
      if (userPin.failedAttempts >= 5) {
        userPin.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lockout
      }
      await this.pinRepo.save(userPin);
      const remaining = 5 - userPin.failedAttempts;
      if (remaining <= 0) {
        throw new ForbiddenException('Too many attempts. Locked for 15 minutes.');
      }
      throw new BadRequestException(`Invalid PIN. ${remaining} attempt(s) remaining.`);
    }

    // Reset on success
    userPin.failedAttempts = 0;
    userPin.lockedUntil = null;
    await this.pinRepo.save(userPin);
    return { verified: true };
  }

  async change(user: User, currentPin: string, newPin: string): Promise<{ success: boolean }> {
    const result = await this.verify(user, currentPin);
    if (!result.verified) {
      throw new BadRequestException('Current PIN is incorrect.');
    }
    const userPin = await this.pinRepo.findOne({ where: { user: { id: user.id } } });
    userPin!.pinHash = await bcrypt.hash(newPin, 10);
    await this.pinRepo.save(userPin!);
    return { success: true };
  }
}
```

**Step 2: Commit**

```bash
git add src/pledges/pin.service.ts
git commit -m "feat(pledges): add PinService with setup, verify, change, and lockout"
```

---

### Task 8: Create GivingProgramsService

**Files:**
- Create: `church-app-api/src/pledges/giving-programs.service.ts`

**Step 1: Create service**

```typescript
// church-app-api/src/pledges/giving-programs.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GivingProgram } from './entities/giving-program.entity';
import { CreateGivingProgramDto } from './dto/create-giving-program.dto';
import { UpdateGivingProgramDto } from './dto/update-giving-program.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class GivingProgramsService {
  constructor(
    @InjectRepository(GivingProgram)
    private programRepo: Repository<GivingProgram>,
  ) {}

  async create(dto: CreateGivingProgramDto, user: User): Promise<GivingProgram> {
    const program = this.programRepo.create({
      ...dto,
      createdBy: user,
    });
    return this.programRepo.save(program);
  }

  async findAll(): Promise<GivingProgram[]> {
    return this.programRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<GivingProgram[]> {
    return this.programRepo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<GivingProgram> {
    const program = await this.programRepo.findOne({ where: { id } });
    if (!program) throw new NotFoundException(`Program ${id} not found`);
    return program;
  }

  async update(id: string, dto: UpdateGivingProgramDto): Promise<GivingProgram> {
    const program = await this.findOne(id);
    Object.assign(program, dto);
    return this.programRepo.save(program);
  }

  async deactivate(id: string): Promise<GivingProgram> {
    const program = await this.findOne(id);
    program.isActive = false;
    return this.programRepo.save(program);
  }
}
```

**Step 2: Commit**

```bash
git add src/pledges/giving-programs.service.ts
git commit -m "feat(pledges): add GivingProgramsService CRUD"
```

---

### Task 9: Create PledgesService

**Files:**
- Create: `church-app-api/src/pledges/pledges.service.ts`

**Step 1: Create service**

```typescript
// church-app-api/src/pledges/pledges.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pledge } from './entities/pledge.entity';
import { PledgePayment } from './entities/pledge-payment.entity';
import { GivingProgram } from './entities/giving-program.entity';
import { CreatePledgeDto } from './dto/create-pledge.dto';
import { UpdatePledgeDto } from './dto/update-pledge.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PledgesService {
  constructor(
    @InjectRepository(Pledge)
    private pledgeRepo: Repository<Pledge>,
    @InjectRepository(PledgePayment)
    private paymentRepo: Repository<PledgePayment>,
    @InjectRepository(GivingProgram)
    private programRepo: Repository<GivingProgram>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // --- Pledges ---

  async create(dto: CreatePledgeDto, adminUser: User): Promise<Pledge> {
    const user = await this.userRepo.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException(`User ${dto.userId} not found`);

    const program = await this.programRepo.findOne({ where: { id: dto.programId } });
    if (!program) throw new NotFoundException(`Program ${dto.programId} not found`);

    const pledge = this.pledgeRepo.create({
      user,
      program,
      pledgeAmount: dto.pledgeAmount,
      totalMonths: dto.totalMonths || null,
      startMonth: dto.startMonth || null,
      notes: dto.notes || null,
      createdBy: adminUser,
    });
    return this.pledgeRepo.save(pledge);
  }

  async findByProgram(programId: string): Promise<Pledge[]> {
    return this.pledgeRepo
      .createQueryBuilder('pledge')
      .leftJoinAndSelect('pledge.user', 'user')
      .leftJoinAndSelect('pledge.program', 'program')
      .leftJoinAndSelect('pledge.createdBy', 'createdBy')
      .leftJoinAndSelect('pledge.payments', 'payments')
      .where('program.id = :programId', { programId })
      .orderBy('user.lastName', 'ASC')
      .addOrderBy('user.firstName', 'ASC')
      .getMany();
  }

  async findByUser(userId: string): Promise<Pledge[]> {
    return this.pledgeRepo
      .createQueryBuilder('pledge')
      .leftJoinAndSelect('pledge.user', 'user')
      .leftJoinAndSelect('pledge.program', 'program')
      .leftJoinAndSelect('pledge.payments', 'payments')
      .leftJoinAndSelect('payments.recordedBy', 'recordedBy')
      .where('user.id = :userId', { userId })
      .andWhere('program.isActive = true')
      .orderBy('program.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Pledge> {
    const pledge = await this.pledgeRepo
      .createQueryBuilder('pledge')
      .leftJoinAndSelect('pledge.user', 'user')
      .leftJoinAndSelect('pledge.program', 'program')
      .leftJoinAndSelect('pledge.createdBy', 'createdBy')
      .leftJoinAndSelect('pledge.payments', 'payments')
      .leftJoinAndSelect('payments.recordedBy', 'recordedBy')
      .where('pledge.id = :id', { id })
      .orderBy('payments.date', 'DESC')
      .getOne();
    if (!pledge) throw new NotFoundException(`Pledge ${id} not found`);
    return pledge;
  }

  async update(id: string, dto: UpdatePledgeDto): Promise<Pledge> {
    const pledge = await this.findOne(id);
    Object.assign(pledge, {
      ...(dto.pledgeAmount !== undefined && { pledgeAmount: dto.pledgeAmount }),
      ...(dto.totalMonths !== undefined && { totalMonths: dto.totalMonths }),
      ...(dto.startMonth !== undefined && { startMonth: dto.startMonth }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
    });
    return this.pledgeRepo.save(pledge);
  }

  async remove(id: string): Promise<void> {
    const pledge = await this.findOne(id);
    await this.pledgeRepo.remove(pledge);
  }

  // --- Payments ---

  async createPayment(pledgeId: string, dto: CreatePaymentDto, user: User): Promise<PledgePayment> {
    const pledge = await this.findOne(pledgeId);
    const payment = this.paymentRepo.create({
      pledge,
      amount: dto.amount,
      date: dto.date,
      month: dto.month || null,
      paymentMethod: dto.paymentMethod,
      notes: dto.notes || null,
      recordedBy: user,
    });
    return this.paymentRepo.save(payment);
  }

  async updatePayment(paymentId: string, dto: UpdatePaymentDto): Promise<PledgePayment> {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException(`Payment ${paymentId} not found`);
    Object.assign(payment, dto);
    return this.paymentRepo.save(payment);
  }

  async removePayment(paymentId: string): Promise<void> {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException(`Payment ${paymentId} not found`);
    await this.paymentRepo.remove(payment);
  }
}
```

**Step 2: Commit**

```bash
git add src/pledges/pledges.service.ts
git commit -m "feat(pledges): add PledgesService with pledge CRUD and payment management"
```

---

### Task 10: Create GivingAnalyticsService

**Files:**
- Create: `church-app-api/src/pledges/giving-analytics.service.ts`

**Step 1: Create analytics service**

```typescript
// church-app-api/src/pledges/giving-analytics.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PledgePayment } from './entities/pledge-payment.entity';
import { Pledge } from './entities/pledge.entity';
import { GivingProgram } from './entities/giving-program.entity';
import { ProgramType } from './entities/program-type.enum';

@Injectable()
export class GivingAnalyticsService {
  constructor(
    @InjectRepository(PledgePayment)
    private paymentRepo: Repository<PledgePayment>,
    @InjectRepository(Pledge)
    private pledgeRepo: Repository<Pledge>,
    @InjectRepository(GivingProgram)
    private programRepo: Repository<GivingProgram>,
  ) {}

  async getSummary(year?: number): Promise<any> {
    const targetYear = year || new Date().getFullYear();
    const startDate = `${targetYear}-01-01`;
    const endDate = `${targetYear}-12-31`;

    // Total collected per program type
    const totals = await this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoin('payment.pledge', 'pledge')
      .leftJoin('pledge.program', 'program')
      .select('program.type', 'programType')
      .addSelect('program.name', 'programName')
      .addSelect('program.id', 'programId')
      .addSelect('SUM(payment.amount)', 'total')
      .addSelect('COUNT(DISTINCT pledge.id)', 'pledgeeCount')
      .where('payment.date >= :startDate', { startDate })
      .andWhere('payment.date <= :endDate', { endDate })
      .groupBy('program.id')
      .addGroupBy('program.type')
      .addGroupBy('program.name')
      .getRawMany();

    const grandTotal = totals.reduce((sum: number, t: any) => sum + parseFloat(t.total || '0'), 0);

    return { year: targetYear, programs: totals, grandTotal };
  }

  async getMonthlyTrends(year?: number): Promise<any[]> {
    const targetYear = year || new Date().getFullYear();
    const startDate = `${targetYear}-01-01`;
    const endDate = `${targetYear}-12-31`;

    const trends = await this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoin('payment.pledge', 'pledge')
      .leftJoin('pledge.program', 'program')
      .select("TO_CHAR(payment.date::date, 'YYYY-MM')", 'month')
      .addSelect('program.type', 'programType')
      .addSelect('SUM(payment.amount)', 'total')
      .where('payment.date >= :startDate', { startDate })
      .andWhere('payment.date <= :endDate', { endDate })
      .groupBy("TO_CHAR(payment.date::date, 'YYYY-MM')")
      .addGroupBy('program.type')
      .orderBy('month', 'ASC')
      .getRawMany();

    return trends;
  }

  async getCompliance(programId: string): Promise<any> {
    const program = await this.programRepo.findOne({ where: { id: programId } });
    if (!program) return { pledgees: [] };

    const pledges = await this.pledgeRepo
      .createQueryBuilder('pledge')
      .leftJoinAndSelect('pledge.user', 'user')
      .leftJoinAndSelect('pledge.payments', 'payments')
      .where('pledge.program.id = :programId', { programId })
      .orderBy('user.lastName', 'ASC')
      .getMany();

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const pledgees = pledges.map((pledge) => {
      const totalPaid = pledge.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const monthsPaid = pledge.payments.length;
      const totalMonths = pledge.totalMonths || 10;

      // Calculate months due: from startMonth to current month
      let monthsDue = 0;
      if (pledge.startMonth) {
        const start = new Date(pledge.startMonth + '-01');
        const end = new Date(currentMonth + '-01');
        monthsDue = Math.max(0,
          (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1
        );
        monthsDue = Math.min(monthsDue, totalMonths);
      }

      const amountDue = monthsDue * Number(pledge.pledgeAmount);
      let status = 'NEW';
      if (monthsPaid >= totalMonths) status = 'COMPLETE';
      else if (monthsPaid >= monthsDue) status = 'ON_TRACK';
      else if (monthsPaid < monthsDue) status = 'BEHIND';

      return {
        pledgeId: pledge.id,
        userId: pledge.user.id,
        firstName: pledge.user.firstName,
        lastName: pledge.user.lastName,
        pledgeAmount: Number(pledge.pledgeAmount),
        totalMonths,
        monthsPaid,
        monthsDue,
        totalPaid,
        amountDue,
        status,
      };
    });

    const complianceRate = pledgees.length > 0
      ? (pledgees.filter(p => p.status === 'ON_TRACK' || p.status === 'COMPLETE').length / pledgees.length) * 100
      : 0;

    return { program, pledgees, complianceRate: Math.round(complianceRate) };
  }

  async getOverdue(programId: string): Promise<any[]> {
    const compliance = await this.getCompliance(programId);
    return compliance.pledgees.filter((p: any) => p.status === 'BEHIND');
  }
}
```

**Step 2: Commit**

```bash
git add src/pledges/giving-analytics.service.ts
git commit -m "feat(pledges): add GivingAnalyticsService with summary, trends, compliance, overdue"
```

---

## Phase 4: Backend — Controllers & Module

### Task 11: Create controllers

**Files:**
- Create: `church-app-api/src/pledges/giving-programs.controller.ts`
- Create: `church-app-api/src/pledges/pledges.controller.ts`
- Create: `church-app-api/src/pledges/pin.controller.ts`
- Create: `church-app-api/src/pledges/giving-analytics.controller.ts`

**Step 1: GivingPrograms controller**

```typescript
// church-app-api/src/pledges/giving-programs.controller.ts
import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards,
} from '@nestjs/common';
import { GivingProgramsService } from './giving-programs.service';
import { CreateGivingProgramDto } from './dto/create-giving-program.dto';
import { UpdateGivingProgramDto } from './dto/update-giving-program.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApprovedGuard } from '../auth/guards/approved.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoleName } from '../users/entities/role.enum';
import { User } from '../users/entities/user.entity';

@Controller('giving-programs')
@UseGuards(JwtAuthGuard, ApprovedGuard)
export class GivingProgramsController {
  constructor(private readonly service: GivingProgramsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleName.PASTOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  create(@Body() dto: CreateGivingProgramDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('active')
  findActive() {
    return this.service.findActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.PASTOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateGivingProgramDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.PASTOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }
}
```

**Step 2: Pledges controller**

```typescript
// church-app-api/src/pledges/pledges.controller.ts
import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { PledgesService } from './pledges.service';
import { CreatePledgeDto } from './dto/create-pledge.dto';
import { UpdatePledgeDto } from './dto/update-pledge.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApprovedGuard } from '../auth/guards/approved.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoleName } from '../users/entities/role.enum';
import { User } from '../users/entities/user.entity';

@Controller('pledges')
@UseGuards(JwtAuthGuard, ApprovedGuard)
export class PledgesController {
  constructor(private readonly service: PledgesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleName.PASTOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  create(@Body() dto: CreatePledgeDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  // IMPORTANT: /my must come before /:id
  @Get('my')
  findMine(@CurrentUser() user: User) {
    return this.service.findByUser(user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(RoleName.PASTOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  findByProgram(@Query('programId') programId: string) {
    return this.service.findByProgram(programId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.PASTOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdatePledgeDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.PASTOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // --- Payments ---

  @Post(':id/payments')
  @UseGuards(RolesGuard)
  @Roles(RoleName.PASTOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  createPayment(
    @Param('id') pledgeId: string,
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: User,
  ) {
    return this.service.createPayment(pledgeId, dto, user);
  }

  @Patch('payments/:paymentId')
  @UseGuards(RolesGuard)
  @Roles(RoleName.PASTOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  updatePayment(@Param('paymentId') paymentId: string, @Body() dto: UpdatePaymentDto) {
    return this.service.updatePayment(paymentId, dto);
  }

  @Delete('payments/:paymentId')
  @UseGuards(RolesGuard)
  @Roles(RoleName.PASTOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  removePayment(@Param('paymentId') paymentId: string) {
    return this.service.removePayment(paymentId);
  }
}
```

**Step 3: PIN controller**

```typescript
// church-app-api/src/pledges/pin.controller.ts
import { Controller, Post, Patch, Get, Body, UseGuards } from '@nestjs/common';
import { PinService } from './pin.service';
import { SetupPinDto } from './dto/setup-pin.dto';
import { VerifyPinDto } from './dto/verify-pin.dto';
import { ChangePinDto } from './dto/change-pin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApprovedGuard } from '../auth/guards/approved.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('user-pin')
@UseGuards(JwtAuthGuard, ApprovedGuard)
export class PinController {
  constructor(private readonly pinService: PinService) {}

  @Get('status')
  hasPin(@CurrentUser() user: User) {
    return this.pinService.hasPin(user);
  }

  @Post('setup')
  setup(@Body() dto: SetupPinDto, @CurrentUser() user: User) {
    return this.pinService.setup(user, dto.pin);
  }

  @Post('verify')
  verify(@Body() dto: VerifyPinDto, @CurrentUser() user: User) {
    return this.pinService.verify(user, dto.pin);
  }

  @Patch('change')
  change(@Body() dto: ChangePinDto, @CurrentUser() user: User) {
    return this.pinService.change(user, dto.currentPin, dto.newPin);
  }
}
```

**Step 4: Analytics controller**

```typescript
// church-app-api/src/pledges/giving-analytics.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { GivingAnalyticsService } from './giving-analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApprovedGuard } from '../auth/guards/approved.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleName } from '../users/entities/role.enum';

@Controller('giving-analytics')
@UseGuards(JwtAuthGuard, ApprovedGuard, RolesGuard)
@Roles(RoleName.PASTOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
export class GivingAnalyticsController {
  constructor(private readonly analyticsService: GivingAnalyticsService) {}

  @Get('summary')
  getSummary(@Query('year') year?: string) {
    return this.analyticsService.getSummary(year ? parseInt(year) : undefined);
  }

  @Get('trends')
  getTrends(@Query('year') year?: string) {
    return this.analyticsService.getMonthlyTrends(year ? parseInt(year) : undefined);
  }

  @Get('compliance')
  getCompliance(@Query('programId') programId: string) {
    return this.analyticsService.getCompliance(programId);
  }

  @Get('overdue')
  getOverdue(@Query('programId') programId: string) {
    return this.analyticsService.getOverdue(programId);
  }
}
```

**Step 5: Commit**

```bash
git add src/pledges/giving-programs.controller.ts src/pledges/pledges.controller.ts src/pledges/pin.controller.ts src/pledges/giving-analytics.controller.ts
git commit -m "feat(pledges): add all controllers — programs, pledges, PIN, analytics"
```

---

### Task 12: Create PledgesModule and register in AppModule

**Files:**
- Create: `church-app-api/src/pledges/pledges.module.ts`
- Modify: `church-app-api/src/app.module.ts`

**Step 1: Create module**

```typescript
// church-app-api/src/pledges/pledges.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GivingProgram } from './entities/giving-program.entity';
import { Pledge } from './entities/pledge.entity';
import { PledgePayment } from './entities/pledge-payment.entity';
import { UserPin } from './entities/user-pin.entity';
import { User } from '../users/entities/user.entity';
import { GivingProgramsService } from './giving-programs.service';
import { PledgesService } from './pledges.service';
import { PinService } from './pin.service';
import { GivingAnalyticsService } from './giving-analytics.service';
import { GivingProgramsController } from './giving-programs.controller';
import { PledgesController } from './pledges.controller';
import { PinController } from './pin.controller';
import { GivingAnalyticsController } from './giving-analytics.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GivingProgram,
      Pledge,
      PledgePayment,
      UserPin,
      User,
    ]),
  ],
  providers: [
    GivingProgramsService,
    PledgesService,
    PinService,
    GivingAnalyticsService,
  ],
  controllers: [
    GivingProgramsController,
    PledgesController,
    PinController,
    GivingAnalyticsController,
  ],
  exports: [PledgesService, GivingProgramsService],
})
export class PledgesModule {}
```

**Step 2: Register in AppModule**

In `church-app-api/src/app.module.ts`, add:
- Import: `import { PledgesModule } from './pledges/pledges.module';`
- Add `PledgesModule` to the `imports` array after `AttendanceModule`

**Step 3: Build and verify**

```bash
cd /Users/daryll/Projects/church-app-api && npm run build
```

Expected: Clean build with no errors.

**Step 4: Commit**

```bash
git add src/pledges/pledges.module.ts src/app.module.ts
git commit -m "feat(pledges): add PledgesModule and register in AppModule"
```

---

## Phase 5: Frontend — Services & Interfaces

### Task 13: Create frontend interfaces

**Files:**
- Create: `church-app-ui/src/app/interfaces/pledge.interface.ts`

**Step 1: Create interfaces**

```typescript
// church-app-ui/src/app/interfaces/pledge.interface.ts
export interface GivingProgram {
  id: string;
  name: string;
  type: 'SEED_FAITH' | 'FAITH_PLEDGE' | 'CUSTOM';
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  createdBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface Pledge {
  id: string;
  user: { id: string; firstName: string; lastName: string; email: string; profilePicture?: string };
  program: GivingProgram;
  pledgeAmount: number;
  totalMonths: number | null;
  startMonth: string | null;
  notes: string | null;
  createdBy: { id: string; firstName: string; lastName: string };
  payments: PledgePayment[];
  createdAt: string;
  updatedAt: string;
}

export interface PledgePayment {
  id: string;
  amount: number;
  date: string;
  month: string | null;
  paymentMethod: 'CASH' | 'GCASH' | 'BANK_TRANSFER' | 'CHECK' | 'OTHER';
  notes: string | null;
  recordedBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

export interface PledgeSummary {
  year: number;
  programs: {
    programId: string;
    programName: string;
    programType: string;
    total: string;
    pledgeeCount: string;
  }[];
  grandTotal: number;
}

export interface ComplianceData {
  program: GivingProgram;
  pledgees: CompliancePledgee[];
  complianceRate: number;
}

export interface CompliancePledgee {
  pledgeId: string;
  userId: string;
  firstName: string;
  lastName: string;
  pledgeAmount: number;
  totalMonths: number;
  monthsPaid: number;
  monthsDue: number;
  totalPaid: number;
  amountDue: number;
  status: 'COMPLETE' | 'ON_TRACK' | 'BEHIND' | 'NEW';
}

export interface MonthlyTrend {
  month: string;
  programType: string;
  total: string;
}
```

**Step 2: Commit**

```bash
git add src/app/interfaces/pledge.interface.ts
git commit -m "feat(pledges): add frontend TypeScript interfaces"
```

---

### Task 14: Create frontend services

**Files:**
- Create: `church-app-ui/src/app/services/pledges.service.ts`
- Create: `church-app-ui/src/app/services/pin.service.ts`

**Step 1: Create PledgesService**

```typescript
// church-app-ui/src/app/services/pledges.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  GivingProgram, Pledge, PledgePayment,
  PledgeSummary, ComplianceData, MonthlyTrend,
} from '../interfaces/pledge.interface';

@Injectable({ providedIn: 'root' })
export class PledgesService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // --- Programs ---
  createProgram(dto: any): Observable<GivingProgram> {
    return this.http.post<GivingProgram>(`${this.apiUrl}/giving-programs`, dto);
  }

  getPrograms(): Observable<GivingProgram[]> {
    return this.http.get<GivingProgram[]>(`${this.apiUrl}/giving-programs`);
  }

  getActivePrograms(): Observable<GivingProgram[]> {
    return this.http.get<GivingProgram[]>(`${this.apiUrl}/giving-programs/active`);
  }

  getProgram(id: string): Observable<GivingProgram> {
    return this.http.get<GivingProgram>(`${this.apiUrl}/giving-programs/${id}`);
  }

  updateProgram(id: string, dto: any): Observable<GivingProgram> {
    return this.http.patch<GivingProgram>(`${this.apiUrl}/giving-programs/${id}`, dto);
  }

  deactivateProgram(id: string): Observable<GivingProgram> {
    return this.http.delete<GivingProgram>(`${this.apiUrl}/giving-programs/${id}`);
  }

  // --- Pledges ---
  createPledge(dto: any): Observable<Pledge> {
    return this.http.post<Pledge>(`${this.apiUrl}/pledges`, dto);
  }

  getPledgesByProgram(programId: string): Observable<Pledge[]> {
    return this.http.get<Pledge[]>(`${this.apiUrl}/pledges`, { params: { programId } });
  }

  getMyPledges(): Observable<Pledge[]> {
    return this.http.get<Pledge[]>(`${this.apiUrl}/pledges/my`);
  }

  getPledge(id: string): Observable<Pledge> {
    return this.http.get<Pledge>(`${this.apiUrl}/pledges/${id}`);
  }

  updatePledge(id: string, dto: any): Observable<Pledge> {
    return this.http.patch<Pledge>(`${this.apiUrl}/pledges/${id}`, dto);
  }

  deletePledge(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/pledges/${id}`);
  }

  // --- Payments ---
  createPayment(pledgeId: string, dto: any): Observable<PledgePayment> {
    return this.http.post<PledgePayment>(`${this.apiUrl}/pledges/${pledgeId}/payments`, dto);
  }

  updatePayment(paymentId: string, dto: any): Observable<PledgePayment> {
    return this.http.patch<PledgePayment>(`${this.apiUrl}/pledges/payments/${paymentId}`, dto);
  }

  deletePayment(paymentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/pledges/payments/${paymentId}`);
  }

  // --- Analytics ---
  getSummary(year?: number): Observable<PledgeSummary> {
    const params = year ? { year: year.toString() } : {};
    return this.http.get<PledgeSummary>(`${this.apiUrl}/giving-analytics/summary`, { params });
  }

  getTrends(year?: number): Observable<MonthlyTrend[]> {
    const params = year ? { year: year.toString() } : {};
    return this.http.get<MonthlyTrend[]>(`${this.apiUrl}/giving-analytics/trends`, { params });
  }

  getCompliance(programId: string): Observable<ComplianceData> {
    return this.http.get<ComplianceData>(`${this.apiUrl}/giving-analytics/compliance`, { params: { programId } });
  }

  getOverdue(programId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/giving-analytics/overdue`, { params: { programId } });
  }
}
```

**Step 2: Create PinService**

```typescript
// church-app-ui/src/app/services/pin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PinService {
  private apiUrl = `${environment.apiUrl}/user-pin`;
  private pinVerifiedSubject = new BehaviorSubject<boolean>(false);
  pinVerified$ = this.pinVerifiedSubject.asObservable();

  constructor(private http: HttpClient) {}

  get isPinVerified(): boolean {
    return this.pinVerifiedSubject.value;
  }

  checkHasPin(): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/status`);
  }

  setupPin(pin: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/setup`, { pin });
  }

  verifyPin(pin: string): Observable<{ verified: boolean }> {
    return this.http.post<{ verified: boolean }>(`${this.apiUrl}/verify`, { pin }).pipe(
      tap((result) => {
        if (result.verified) {
          this.pinVerifiedSubject.next(true);
        }
      }),
    );
  }

  changePin(currentPin: string, newPin: string): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.apiUrl}/change`, { currentPin, newPin });
  }

  clearVerification() {
    this.pinVerifiedSubject.next(false);
  }
}
```

**Step 3: Commit**

```bash
git add src/app/services/pledges.service.ts src/app/services/pin.service.ts
git commit -m "feat(pledges): add frontend PledgesService and PinService"
```

---

## Phase 6: Frontend — Pledges Landing Page (PIN Gate + Member View)

### Task 15: Create pledges landing page with PIN gate

**Files:**
- Create: `church-app-ui/src/app/pages/pledges/pledges.page.ts`
- Create: `church-app-ui/src/app/pages/pledges/pledges.page.html`
- Create: `church-app-ui/src/app/pages/pledges/pledges.page.scss`
- Modify: `church-app-ui/src/app/app.routes.ts` — add pledges routes

**Step 1: Create component TypeScript**

The pledges landing page has 3 states: `setup` (first-time PIN), `verify` (enter PIN), `dashboard` (PIN verified). Admin/Pastor sees admin dashboard; regular users see their own pledges.

```typescript
// church-app-ui/src/app/pages/pledges/pledges.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonMenuButton, IonButtons, IonIcon, IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { lockClosedOutline, logOutOutline, heartOutline } from 'ionicons/icons';
import { PinService } from '../../services/pin.service';
import { PledgesService } from '../../services/pledges.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../components/toast/toast.service';
import { Pledge, GivingProgram } from '../../interfaces/pledge.interface';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-pledges',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonMenuButton, IonButtons, IonIcon, IonSpinner,
  ],
  templateUrl: './pledges.page.html',
  styleUrls: ['./pledges.page.scss'],
})
export class PledgesPage implements OnInit {
  isWeb = environment.platform === 'web';
  pinState: 'loading' | 'setup' | 'verify' | 'dashboard' = 'loading';
  pinInput = '';
  pinConfirm = '';
  pinError = '';
  isSubmittingPin = false;
  isAdmin = false;

  // Member data
  myPledges: Pledge[] = [];
  isLoadingPledges = false;

  // Admin data
  programs: GivingProgram[] = [];
  adminTab: 'programs' | 'analytics' = 'programs';

  constructor(
    private pinService: PinService,
    private pledgesService: PledgesService,
    private authService: AuthService,
    private toast: ToastService,
  ) {
    addIcons({ lockClosedOutline, logOutOutline, heartOutline });
  }

  ngOnInit() {
    this.isAdmin = this.authService.hasRole('PASTOR') ||
      this.authService.hasRole('ADMIN') ||
      this.authService.hasRole('SUPER_ADMIN');

    // Check if PIN is already verified this session
    if (this.pinService.isPinVerified) {
      this.pinState = 'dashboard';
      this.loadDashboard();
      return;
    }

    this.pinService.checkHasPin().subscribe({
      next: (hasPin) => {
        this.pinState = hasPin ? 'verify' : 'setup';
      },
      error: () => {
        this.pinState = 'setup';
      },
    });
  }

  setupPin() {
    if (this.pinInput.length < 4 || this.pinInput.length > 6) {
      this.pinError = 'PIN must be 4-6 digits';
      return;
    }
    if (!/^\d+$/.test(this.pinInput)) {
      this.pinError = 'PIN must contain only numbers';
      return;
    }
    if (this.pinInput !== this.pinConfirm) {
      this.pinError = 'PINs do not match';
      return;
    }
    this.pinError = '';
    this.isSubmittingPin = true;
    this.pinService.setupPin(this.pinInput).subscribe({
      next: () => {
        this.toast.success('PIN set successfully');
        // Auto-verify after setup
        this.pinService.verifyPin(this.pinInput).subscribe({
          next: () => {
            this.pinState = 'dashboard';
            this.loadDashboard();
            this.isSubmittingPin = false;
          },
        });
      },
      error: (err) => {
        this.pinError = err.error?.message || 'Failed to set PIN';
        this.isSubmittingPin = false;
      },
    });
  }

  verifyPin() {
    if (!this.pinInput) {
      this.pinError = 'Please enter your PIN';
      return;
    }
    this.pinError = '';
    this.isSubmittingPin = true;
    this.pinService.verifyPin(this.pinInput).subscribe({
      next: () => {
        this.pinState = 'dashboard';
        this.loadDashboard();
        this.isSubmittingPin = false;
      },
      error: (err) => {
        this.pinError = err.error?.message || 'Invalid PIN';
        this.isSubmittingPin = false;
        this.pinInput = '';
      },
    });
  }

  loadDashboard() {
    if (this.isAdmin) {
      this.loadPrograms();
    } else {
      this.loadMyPledges();
    }
  }

  loadPrograms() {
    this.pledgesService.getPrograms().subscribe({
      next: (data) => this.programs = data,
    });
  }

  loadMyPledges() {
    this.isLoadingPledges = true;
    this.pledgesService.getMyPledges().subscribe({
      next: (data) => {
        this.myPledges = data;
        this.isLoadingPledges = false;
      },
      error: () => this.isLoadingPledges = false,
    });
  }

  getTotalPaid(pledge: Pledge): number {
    return pledge.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  }

  getRemaining(pledge: Pledge): number {
    if (pledge.program.type === 'FAITH_PLEDGE') {
      const total = Number(pledge.pledgeAmount) * (pledge.totalMonths || 10);
      return Math.max(0, total - this.getTotalPaid(pledge));
    }
    return Math.max(0, Number(pledge.pledgeAmount) - this.getTotalPaid(pledge));
  }

  getProgress(pledge: Pledge): number {
    if (pledge.program.type !== 'FAITH_PLEDGE') return 0;
    const totalMonths = pledge.totalMonths || 10;
    return pledge.payments.length;
  }

  getProgressPercent(pledge: Pledge): number {
    if (pledge.program.type !== 'FAITH_PLEDGE') return 0;
    const totalMonths = pledge.totalMonths || 10;
    return Math.min(100, (pledge.payments.length / totalMonths) * 100);
  }

  getProgramTypeBadge(type: string): string {
    switch (type) {
      case 'SEED_FAITH': return 'Seed Faith';
      case 'FAITH_PLEDGE': return 'Faith Pledge';
      case 'CUSTOM': return 'Custom';
      default: return type;
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }
}
```

**Step 2: Create HTML template**

This file will be large — it contains both the PIN gate UI and the member dashboard (web + mobile). The admin programs list and analytics will be in separate pages linked from this dashboard.

Create `church-app-ui/src/app/pages/pledges/pledges.page.html` with:
- Web: PIN setup/verify screens (centered card), then admin dashboard (programs table + analytics tab) or member view (pledge cards)
- Mobile: Same logic with Ionic components

**Step 3: Create SCSS**

Create `church-app-ui/src/app/pages/pledges/pledges.page.scss` with:
- `.pin-gate` — centered card with max-width 400px
- `.pin-input` — large centered digit input
- `.pledge-cards` — grid of pledge summary cards
- `.progress-bar` — horizontal bar with fill
- `.payment-history` — list of payment entries
- Standard web design system classes (`.card`, `.btn`, etc.)

**Step 4: Add routes**

In `church-app-ui/src/app/app.routes.ts`, add before the catch-all redirect:

```typescript
{
  path: 'pledges',
  canActivate: [authGuard, approvedGuard],
  loadComponent: () => import('./pages/pledges/pledges.page').then((m) => m.PledgesPage),
},
{
  path: 'pledges/programs/new',
  canActivate: [authGuard, approvedGuard, roleGuard('PASTOR', 'ADMIN', 'SUPER_ADMIN')],
  loadComponent: () => import('./pages/pledges/program-form.page').then((m) => m.ProgramFormPage),
},
{
  path: 'pledges/programs/:id/edit',
  canActivate: [authGuard, approvedGuard, roleGuard('PASTOR', 'ADMIN', 'SUPER_ADMIN')],
  loadComponent: () => import('./pages/pledges/program-form.page').then((m) => m.ProgramFormPage),
},
{
  path: 'pledges/programs/:id',
  canActivate: [authGuard, approvedGuard, roleGuard('PASTOR', 'ADMIN', 'SUPER_ADMIN')],
  loadComponent: () => import('./pages/pledges/program-detail.page').then((m) => m.ProgramDetailPage),
},
{
  path: 'pledges/analytics',
  canActivate: [authGuard, approvedGuard, roleGuard('PASTOR', 'ADMIN', 'SUPER_ADMIN')],
  loadComponent: () => import('./pages/pledges/giving-analytics.page').then((m) => m.GivingAnalyticsPage),
},
```

**Step 5: Add to sidebar navigation**

In `church-app-ui/src/app/app.component.html`:
- **Web sidebar**: Add a "Pledges" link with heart SVG icon after "Kids and Teens", linking to `/pledges`
- **Mobile menu**: Add "Pledges" `ion-item` with `heart-outline` icon

In `church-app-ui/src/app/app.component.ts`:
- Add `heartOutline` to `addIcons()`

**Step 6: Build and verify**

```bash
cd /Users/daryll/Projects/church-app-ui && npm run build:web
```

**Step 7: Commit**

```bash
git add src/app/pages/pledges/ src/app/app.routes.ts src/app/app.component.html src/app/app.component.ts
git commit -m "feat(pledges): add pledges landing page with PIN gate and member view"
```

---

## Phase 7: Frontend — Admin Program Management Pages

### Task 16: Create Program Form page

**Files:**
- Create: `church-app-ui/src/app/pages/pledges/program-form.page.ts`
- Create: `church-app-ui/src/app/pages/pledges/program-form.page.html`
- Create: `church-app-ui/src/app/pages/pledges/program-form.page.scss`

Build a form with fields: name, type (SEED_FAITH/FAITH_PLEDGE/CUSTOM), description, startDate, endDate. For FAITH_PLEDGE type, show additional "Default Months" (default 10) field. Support both create and edit modes (check route param `:id`).

Follow the pattern from `worship-lineup-form.page.ts`: ReactiveFormsModule, `isEditMode` flag, `form: FormGroup`, etc.

**Step 1: Commit after implementation**

```bash
git add src/app/pages/pledges/program-form.*
git commit -m "feat(pledges): add program form page (create + edit)"
```

---

### Task 17: Create Program Detail page

**Files:**
- Create: `church-app-ui/src/app/pages/pledges/program-detail.page.ts`
- Create: `church-app-ui/src/app/pages/pledges/program-detail.page.html`
- Create: `church-app-ui/src/app/pages/pledges/program-detail.page.scss`

Shows:
- Program info card (name, type, dates, status)
- "Add Pledgee" button → opens a modal to select a user + set pledge amount
- Pledgees table with columns: Name, Pledge Amount, Total Paid, Balance, Status badge
- Click a pledgee row → expand/navigate to show payment history + "Record Payment" button
- "Record Payment" modal: amount, date, month (for Faith Pledge), payment method, notes

Uses `ModalService` for add pledgee and record payment modals.
Uses `HttpClient` to fetch users for the "Add Pledgee" dropdown (`GET /users/by-roles?roles=...` with all roles).

**Step 1: Commit after implementation**

```bash
git add src/app/pages/pledges/program-detail.*
git commit -m "feat(pledges): add program detail page with pledgee table and payment recording"
```

---

## Phase 8: Frontend — Analytics Dashboard

### Task 18: Create Giving Analytics page

**Files:**
- Create: `church-app-ui/src/app/pages/pledges/giving-analytics.page.ts`
- Create: `church-app-ui/src/app/pages/pledges/giving-analytics.page.html`
- Create: `church-app-ui/src/app/pages/pledges/giving-analytics.page.scss`

Sections:
1. **Summary cards** (top row) — Total collected, per-program totals, compliance rate
2. **Year selector** — dropdown to pick year
3. **Monthly trends** — CSS bar chart (12 months), color-coded by program type. Use the same CSS-only bar pattern from youth profile attendance analytics.
4. **Faith Pledge compliance table** — select program → shows pledgees with status badges
5. **Overdue list** — filtered from compliance data where status === 'BEHIND'
6. **Year-over-year** — fetch summary for current year and previous year, show comparison cards

Design system: `.card` containers, `.btn` for actions, `.badge` for status, CSS bar charts, standard table layout from `profiles-table-web` pattern.

**Step 1: Commit after implementation**

```bash
git add src/app/pages/pledges/giving-analytics.*
git commit -m "feat(pledges): add giving analytics dashboard with trends, compliance, overdue"
```

---

## Phase 9: Integration & Polish

### Task 19: Clear PIN on logout

**Files:**
- Modify: `church-app-ui/src/app/services/auth.service.ts`

In the `logout()` method, call `this.pinService.clearVerification()` to reset the in-memory PIN session.

- Import `PinService` and inject in constructor
- Add `this.pinService.clearVerification()` in `logout()`

**Step 1: Commit**

```bash
git add src/app/services/auth.service.ts
git commit -m "feat(pledges): clear PIN verification on logout"
```

---

### Task 20: Final build verification

**Step 1: Build API**

```bash
cd /Users/daryll/Projects/church-app-api && npm run build
```

Expected: Clean build.

**Step 2: Build UI**

```bash
cd /Users/daryll/Projects/church-app-ui && npm run build:web
```

Expected: Clean build.

**Step 3: Commit any fixes**

If build errors, fix and commit.

---

## Execution Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-5 | Backend entities & enums |
| 2 | 6 | Backend DTOs |
| 3 | 7-10 | Backend services |
| 4 | 11-12 | Backend controllers & module |
| 5 | 13-14 | Frontend interfaces & services |
| 6 | 15 | Pledges landing page (PIN + member view) |
| 7 | 16-17 | Admin program management |
| 8 | 18 | Analytics dashboard |
| 9 | 19-20 | Integration & final build |

**Total: 20 tasks across 9 phases**
