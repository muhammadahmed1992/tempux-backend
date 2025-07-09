export class BaseRepository<
  TModel,
  TCreateInput,
  TUpdateInput,
  TWhereUniqueInput,
  TFindUniqueArgs extends { where: TWhereUniqueInput; select?: object },
  TFindManyArgs extends object
> {
  constructor(
    protected readonly model: {
      create: (args: {
        data: TCreateInput;
        select?: object;
      }) => Promise<TModel>;
      findUnique: (args: TFindUniqueArgs) => Promise<TModel | null>;
      findMany: (args: TFindManyArgs) => Promise<TModel[]>;
      update: (args: {
        where: TWhereUniqueInput;
        data: TUpdateInput;
        select?: object;
      }) => Promise<TModel>;
      delete: (args: {
        where: TWhereUniqueInput;
        select?: object;
      }) => Promise<TModel>;
      count: (args?: { where?: object }) => Promise<number>;
    }
  ) {}

  async create(data: TCreateInput, select?: object): Promise<TModel> {
    return this.model.create({ data, ...(select && { select }) });
  }

  async findUnique(args: TFindUniqueArgs): Promise<TModel | null> {
    return this.model.findUnique(args);
  }

  async findMany(args: TFindManyArgs): Promise<TModel[]> {
    return this.model.findMany(args);
  }

  async update(
    where: TWhereUniqueInput,
    data: TUpdateInput,
    select?: object
  ): Promise<TModel> {
    return this.model.update({ where, data, ...(select && { select }) });
  }

  async delete(where: TWhereUniqueInput, select?: object): Promise<TModel> {
    return this.model.delete({ where, ...(select && { select }) });
  }

  async count(where?: object): Promise<number> {
    return this.model.count({ where });
  }
}
