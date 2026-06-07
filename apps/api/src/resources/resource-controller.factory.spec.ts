import 'reflect-metadata';
import { PERMISSIONS_KEY } from '../common/guards/permissions.decorator';
import { createResourceController } from './resource-controller.factory';

describe('createResourceController', () => {
  it('uses manage_portfolio as the default write permission', () => {
    const Controller = createResourceController('projects', 'project');

    expect(writePermissionsFor(Controller, 'create')).toEqual([
      'manage_portfolio',
    ]);
    expect(writePermissionsFor(Controller, 'update')).toEqual([
      'manage_portfolio',
    ]);
    expect(writePermissionsFor(Controller, 'remove')).toEqual([
      'manage_portfolio',
    ]);
  });

  it('allows settings-only controllers to override the write permission', () => {
    const Controller = createResourceController(
      'app-modules',
      'appModule',
      'manage_settings',
    );

    expect(writePermissionsFor(Controller, 'create')).toEqual([
      'manage_settings',
    ]);
    expect(writePermissionsFor(Controller, 'update')).toEqual([
      'manage_settings',
    ]);
    expect(writePermissionsFor(Controller, 'remove')).toEqual([
      'manage_settings',
    ]);
  });
});

function writePermissionsFor(
  Controller: ReturnType<typeof createResourceController>,
  method: 'create' | 'update' | 'remove',
) {
  return Reflect.getMetadata(PERMISSIONS_KEY, Controller.prototype[method]);
}
