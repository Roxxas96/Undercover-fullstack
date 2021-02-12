import { TestBed } from '@angular/core/testing';

import { RecoverGuard } from './recover.guard';

describe('RecoverGuard', () => {
  let guard: RecoverGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(RecoverGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
