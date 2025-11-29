import { container } from 'tsyringe';

// Services
import { AuthService } from './services/auth.service.js';
import { ProductService } from './services/product.service.js';
import { CategoryService } from './services/category.service.js';
import { SettingsService } from './services/settings.service.js';
import { UploadService } from './services/upload.service.js';
import { OrderService } from './services/order.service.js';

// Register services as singletons
container.registerSingleton('AuthService', AuthService);
container.registerSingleton('ProductService', ProductService);
container.registerSingleton('CategoryService', CategoryService);
container.registerSingleton('SettingsService', SettingsService);
container.registerSingleton('UploadService', UploadService);
container.registerSingleton('OrderService', OrderService);

export { container };



