import { TestBed } from '@angular/core/testing';

import { Bpm } from './bpm';

describe('Bpm', () => {
  let service: Bpm;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Bpm);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
