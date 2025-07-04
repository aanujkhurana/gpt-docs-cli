// A simple example file to demonstrate gpt-docs

function calculateTotal(items, taxRate) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * taxRate;
  return subtotal + tax;
}

class ShoppingCart {
  constructor() {
    this.items = [];
  }
  
  addItem(item) {
    this.items.push(item);
  }
  
  removeItem(id) {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items.splice(index, 1);
      return true;
    }
    return false;
  }
  
  getTotal(taxRate = 0.1) {
    return calculateTotal(this.items, taxRate);
  }
}

const formatCurrency = (amount) => {
  return `$${amount.toFixed(2)}`;
};

// Usage example
const cart = new ShoppingCart();
cart.addItem({ id: 1, name: 'Book', price: 10.99 });
cart.addItem({ id: 2, name: 'Pen', price: 1.99 });
const total = cart.getTotal();
console.log(`Total: ${formatCurrency(total)}`);