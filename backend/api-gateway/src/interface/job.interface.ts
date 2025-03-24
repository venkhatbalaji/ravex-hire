import { CreateJobDto } from '../validators/create-job.dto';
import { Observable } from 'rxjs';

export interface IJobGrpcService {
  CreateJob(data: CreateJobDto): Observable<any>;
}
