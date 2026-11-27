import type {Env} from '../types';
declare const worker: {fetch(request:Request,env:Env,ctx:ExecutionContext):Promise<Response>;scheduled(controller:ScheduledController,env:Env,ctx:ExecutionContext):Promise<void>};
export default worker;
