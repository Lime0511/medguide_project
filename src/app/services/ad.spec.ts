import { TestBed } from '@angular/core/testing';
import { AdService } from './ad';
import { Platform } from '@ionic/angular';

describe('AdService', () => {
  let service: AdService;
  let platform: jasmine.SpyObj<Platform>;

  beforeEach(() => {
    // Create a mock platform object to simulate different platforms (like 'capacitor')
    platform = jasmine.createSpyObj('Platform', ['is']);

    // Set the platform to be 'capacitor' (or modify this as needed for your tests)
    platform.is.and.returnValue(true);

    TestBed.configureTestingModule({
      providers: [
        AdService,
        { provide: Platform, useValue: platform }
      ]
    });
    service = TestBed.inject(AdService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize AdMob', () => {
    // Check that the initialize method was called
    service.initialize();
    expect(platform.is).toHaveBeenCalledWith('capacitor');
  });

  it('should show a banner ad for non-Pro users', () => {
    // Simulate that the user is not Pro
    spyOn(console, 'log');
    service.showBanner();
    expect(console.log).toHaveBeenCalledWith('[AdService] SIMULATING: Showing Banner Ad');
  });

  it('should not show a banner ad for Pro users', () => {
    // Simulate the Pro purchase
    service.purchasePro();
    spyOn(console, 'log');
    service.showBanner();
    expect(console.log).not.toHaveBeenCalledWith('[AdService] SIMULATING: Showing Banner Ad');
  });

  it('should show an interstitial ad for non-Pro users', () => {
    // Simulate that the user is not Pro
    spyOn(console, 'log');
    service.showInterstitial();
    expect(console.log).toHaveBeenCalledWith('[AdService] SIMULATING: Showing Interstitial Ad');
  });

  it('should not show an interstitial ad for Pro users', () => {
    // Simulate the Pro purchase
    service.purchasePro();
    spyOn(console, 'log');
    service.showInterstitial();
    expect(console.log).not.toHaveBeenCalledWith('[AdService] SIMULATING: Showing Interstitial Ad');
  });
});
