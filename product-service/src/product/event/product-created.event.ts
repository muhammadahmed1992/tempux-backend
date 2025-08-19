export class ProductCreatedEvent {
  constructor(
    public readonly userId: bigint,
    public readonly productId: bigint,
  ) {}
}
