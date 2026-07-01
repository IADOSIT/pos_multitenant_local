import { Repository } from 'typeorm';
import { Empleado } from './empleado.entity';
import { HorarioEmpleado } from './horario-empleado.entity';
export declare class EmpleadosService {
    private readonly repo;
    private readonly horarioRepo;
    constructor(repo: Repository<Empleado>, horarioRepo: Repository<HorarioEmpleado>);
    findAll(scope: any): Promise<Empleado[]>;
    findOne(id: number, scope: any): Promise<Empleado>;
    create(data: any, scope: any): Promise<Empleado[]>;
    update(id: number, data: any, scope: any): Promise<Empleado>;
    toggle(id: number, scope: any): Promise<Empleado>;
    setFmdTemplate(id: number, fmdB64: string, scope: any): Promise<Empleado>;
    clearFmdTemplate(id: number, scope: any): Promise<Empleado>;
    getTemplates(empresa_id: number): Promise<Empleado[]>;
    findById(id: number): Promise<Empleado | null>;
    setHorario(empleado_id: number, horarios: any[], scope: any): Promise<HorarioEmpleado[]>;
    getHorarios(empleado_id: number, scope: any): Promise<HorarioEmpleado[]>;
}
