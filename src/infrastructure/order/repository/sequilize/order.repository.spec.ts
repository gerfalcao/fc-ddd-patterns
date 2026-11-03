import { Sequelize } from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";

describe("Order repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should create a new order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("123", "123", [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });

  async function setupCustomerAndProducts() {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product1 = new Product("p1", "Product 1", 10);
    const product2 = new Product("p2", "Product 2", 20);
    await productRepository.create(product1);
    await productRepository.create(product2);

    return { customer, product1, product2 };
  }

  it("should update an order", async () => {
    const { customer, product1, product2 } = await setupCustomerAndProducts();

    const item1 = new OrderItem("i1", product1.name, product1.price, product1.id, 2);
    const order = new Order("o1", customer.id, [item1]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const item1Changed = new OrderItem("i1", product1.name, product1.price, product1.id, 5);
    const item2 = new OrderItem("i2", product2.name, product2.price, product2.id, 1);
    const updatedOrder = new Order("o1", customer.id, [item1Changed, item2]);

    await orderRepository.update(updatedOrder);

    const orderModel = await OrderModel.findOne({
      where: { id: "o1" },
      include: ["items"],
      order: [["items", "id", "ASC"]],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "o1",
      customer_id: customer.id,
      total: 70,
      items: [
        {
          id: "i1",
          name: product1.name,
          price: product1.price,
          quantity: 5,
          order_id: "o1",
          product_id: product1.id,
        },
        {
          id: "i2",
          name: product2.name,
          price: product2.price,
          quantity: 1,
          order_id: "o1",
          product_id: product2.id,
        },
      ],
    });
  });

  it("should remove items on update", async () => {
    const { customer, product1, product2 } = await setupCustomerAndProducts();

    const item1 = new OrderItem("i1", product1.name, product1.price, product1.id, 2);
    const item2 = new OrderItem("i2", product2.name, product2.price, product2.id, 1);
    const order = new Order("o1", customer.id, [item1, item2]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    await orderRepository.update(new Order("o1", customer.id, [item2]));

    const items = await OrderItemModel.findAll({ where: { order_id: "o1" } });
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("i2");

    const orderModel = await OrderModel.findOne({ where: { id: "o1" } });
    expect(orderModel.total).toBe(20);
  });

  it("should find an order", async () => {
    const { customer, product1 } = await setupCustomerAndProducts();

    const item1 = new OrderItem("i1", product1.name, product1.price, product1.id, 3);
    const order = new Order("o1", customer.id, [item1]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const foundOrder = await orderRepository.find("o1");

    expect(foundOrder).toStrictEqual(order);
    expect(foundOrder.total()).toBe(30);
  });

  it("should throw an error when order is not found", async () => {
    const orderRepository = new OrderRepository();

    await expect(orderRepository.find("not-exists")).rejects.toThrow(
      "Order not found"
    );
  });

  it("should find all orders", async () => {
    const { customer, product1, product2 } = await setupCustomerAndProducts();

    const order1 = new Order("o1", customer.id, [
      new OrderItem("i1", product1.name, product1.price, product1.id, 1),
    ]);
    const order2 = new Order("o2", customer.id, [
      new OrderItem("i2", product2.name, product2.price, product2.id, 2),
      new OrderItem("i3", product1.name, product1.price, product1.id, 4),
    ]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order1);
    await orderRepository.create(order2);

    const orders = await orderRepository.findAll();

    expect(orders).toHaveLength(2);
    expect(orders).toContainEqual(order1);
    expect(orders).toContainEqual(order2);
  });
});
