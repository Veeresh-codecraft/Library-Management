import { IPageRequest, IPagedResponse } from "./pagination.model";

export interface IRepository<MutationModel, CompleteModel> {
  create(data: MutationModel): Promise<CompleteModel>;
  update(id: number, data: MutationModel): Promise<CompleteModel | null>;
  delete(id: number): Promise<CompleteModel | null>;
  getById(id: number): CompleteModel | null;
  list(params: IPageRequest): IPagedResponse<CompleteModel>;
}
