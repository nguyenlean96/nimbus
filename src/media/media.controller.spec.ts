import { Test, TestingModule } from '@nestjs/testing';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { Media } from './entities/media.entity';

// Mock file for testing
const createMockFile = (
  originalName: string,
  mimeType: string,
  size: number,
): Express.Multer.File => ({
  fieldname: 'file',
  originalname: originalName,
  encoding: '7bit',
  mimetype: mimeType,
  size: size,
  destination: './storage/public/tmp',
  filename: `${Date.now()}-${originalName}`,
  path: `./storage/public/tmp/${Date.now()}-${originalName}`,
  buffer: Buffer.from('test file content'),
  stream: null as any,
});

describe('MediaController', () => {
  let controller: MediaController;
  let service: MediaService;

  // Mock media service to avoid database interactions during tests
  const mockMediaService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getMediaUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [
        {
          provide: MediaService,
          useValue: mockMediaService,
        },
      ],
    }).compile();

    controller = module.get<MediaController>(MediaController);
    service = module.get<MediaService>(MediaService);

    // Reset all mock implementations before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new media item with valid file', async () => {
      // Setup mock file
      const mockFile = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024);
      const createMediaDto: CreateMediaDto = { collection: 'test-collection' };
      
      // Setup mock return value
      const mockMedia = {
        id: 1,
        fileName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024 * 1024,
        collection: 'test-collection',
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        created_at: new Date(),
        updated_at: new Date(),
      } as Media;
      
      mockMediaService.create.mockResolvedValue(mockMedia);
      mockMediaService.getMediaUrl.mockReturnValue('/storage/1/test.jpg');
      
      // Make request
      const result = await controller.create(createMediaDto, mockFile);
      
      // Assertions
      expect(service.create).toHaveBeenCalledWith(createMediaDto, mockFile);
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('urls');
      expect(result.urls).toHaveProperty('original');
      expect(result.urls).toHaveProperty('thumb');
      expect(result.urls).toHaveProperty('small');
      expect(result.urls).toHaveProperty('medium');
      expect(result.urls).toHaveProperty('large');
    });

    // Note: File validation tests will be handled by the middleware
    // but we can still test the endpoint behavior with different files
  });

  describe('findAll', () => {
    it('should return an array of media items with URLs', async () => {
      // Mock return value
      const mockMediaItems = [
        {
          id: 1,
          fileName: 'test1.jpg',
          mimeType: 'image/jpeg',
          size: 1024 * 1024,
          collection: 'collection1',
          uuid: '550e8400-e29b-41d4-a716-446655440001',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          fileName: 'test2.png',
          mimeType: 'image/png',
          size: 2048 * 1024,
          collection: 'collection2',
          uuid: '550e8400-e29b-41d4-a716-446655440002',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ] as Media[];

      mockMediaService.findAll.mockResolvedValue(mockMediaItems);
      mockMediaService.getMediaUrl.mockImplementation((media, conversion) => {
        return `/storage/${media.id}/${conversion ? `${conversion}_` : ''}${media.fileName}`;
      });

      // Call the controller method
      const result = await controller.findAll();

      // Assertions
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('urls');
      expect(result[0].urls.original).toBe('/storage/1/test1.jpg');
      expect(result[1].urls.original).toBe('/storage/2/test2.png');
    });
  });

  describe('findOne', () => {
    it('should return a single media item with URLs', async () => {
      // Mock return value
      const mockMedia = {
        id: 1,
        fileName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024 * 1024,
        collection: 'test-collection',
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        created_at: new Date(),
        updated_at: new Date(),
      } as Media;

      mockMediaService.findOne.mockResolvedValue(mockMedia);
      mockMediaService.getMediaUrl.mockImplementation((media, conversion) => {
        return `/storage/${media.id}/${conversion ? `${conversion}_` : ''}${media.fileName}`;
      });

      // Call the controller method
      const result = await controller.findOne('1');

      // Assertions
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toHaveProperty('id', 1);
      expect(result.urls.original).toBe('/storage/1/test.jpg');
      expect(result.urls.thumb).toBe('/storage/1/thumb_test.jpg');
    });

    it('should throw NotFoundException when media is not found', async () => {
      // Setup mock to return null (not found)
      mockMediaService.findOne.mockResolvedValue(null);

      // Assertions
      await expect(controller.findOne('999')).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith(999);
    });
  });

  describe('update', () => {
    it('should update a media item', async () => {
      // Setup
      const updateMediaDto: UpdateMediaDto = { fileName: 'updated.jpg' };
      const mockUpdatedMedia = {
        id: 1,
        fileName: 'updated.jpg',
        mimeType: 'image/jpeg',
        size: 1024 * 1024,
        collection: 'test-collection',
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        created_at: new Date(),
        updated_at: new Date(),
      } as Media;

      mockMediaService.update.mockResolvedValue(mockUpdatedMedia);

      // Call the controller method
      const result = await controller.update('1', updateMediaDto);

      // Assertions
      expect(service.update).toHaveBeenCalledWith(1, updateMediaDto);
      expect(result).toEqual(mockUpdatedMedia);
    });
  });

  describe('remove', () => {
    it('should delete a media item', async () => {
      // Setup
      const mockResult = { success: true, message: 'Media deleted successfully' };
      mockMediaService.remove.mockResolvedValue(mockResult);

      // Call the controller method
      const result = await controller.remove('1');

      // Assertions
      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResult);
    });
  });
});