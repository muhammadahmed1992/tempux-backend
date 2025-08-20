export default class Meta {
  constructor(pageNumber: number, pageSize: number, totalCount: number) {
    this.pageNumber = pageNumber;
    this.pageSize = pageSize;
    this.totalCount = totalCount;
  }
  pageNumber = 0;
  pageSize = 0;
  totalCount = 0;
  numberOfTotalPages = 0;
}
