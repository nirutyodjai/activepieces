import React from 'react';
import { render, screen } from '@testing-library/react';
import FeaturedService from './featured-service';
import useIntersectionObserver from '@/hooks/use-intersection-observer';

// Mock the useIntersectionObserver hook
jest.mock('@/hooks/use-intersection-observer');
const mockUseIntersectionObserver = useIntersectionObserver as jest.Mock;

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, ...props }: any) => <img alt={ alt } { ...props } />
}));

describe('FeaturedService', () => {
  beforeEach(() => {
    // Before each test, set the mock to return a visible state
    mockUseIntersectionObserver.mockReturnValue([React.createRef(), true]);
  });

  it('renders the main heading', () => {
    render(<FeaturedService />);
    const heading = screen.getByRole('heading', {
      name: /บริการทดสอบสายสัญญาณด้วยเครื่อง Fluke/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it('renders all feature check items', () => {
    render(<FeaturedService />);
    expect(screen.getByText('ตรวจสอบความต่อเนื่อง (Wiremap)')).toBeInTheDocument();
    expect(screen.getByText('ทดสอบประสิทธิภาพ (Performance Test)')).toBeInTheDocument();
    expect(screen.getByText('ออกรายงานรับรอง (Certification Report)')).toBeInTheDocument();
  });

  it('renders the "view service rates" button', () => {
    render(<FeaturedService />);
    const button = screen.getByRole('link', { name: /ดูอัตราค่าบริการ/i });
    expect(button).toBeInTheDocument();
  });

  it('renders the report reading section', () => {
    render(<FeaturedService />);
  expect(screen.getByText('อ่านผล รายงานการทดสอบของ Fluke Networks')).toBeInTheDocument();
    expect(screen.getByText('ทำความเข้าใจความหมายของค่าต่างๆ ในรายงานผลการทดสอบ')).toBeInTheDocument();
  });

  it('renders accordion items for report explanation', () => {
    render(<FeaturedService />);
  expect(screen.getByText('เฮดรูม (NEXT)')).toBeInTheDocument();
  expect(screen.getByText('ความยาว')).toBeInTheDocument();
  expect(screen.getByText('ขีดจำกัดการทดสอบ')).toBeInTheDocument();
  expect(screen.getByText('สรุป: ผ่าน')).toBeInTheDocument();
  });
});
