import { IPageRequest, IPagedResponse } from "./pagination";

export interface IRepository<MutationModel, CompleteModel> {
  create(data: MutationModel): CompleteModel;
  update(id: number, data: MutationModel): CompleteModel | null;
  delete(id: number): CompleteModel | null;
  getById(id: number): CompleteModel | null;
  list(params: IPageRequest): IPagedResponse<CompleteModel>;
}