/**
 * Unit Tests for EinsteinGenerateButton Component
 * 
 * Tests core functionality:
 * - Rendering with default props
 * - Click handling
 * - Loading state
 * - Disabled state
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EinsteinGenerateButton from '../../../components/Einstein/EinsteinGenerateButton';

describe('EinsteinGenerateButton', () => {
  it('renders with default text', () => {
    render(<EinsteinGenerateButton onClick={() => {}} />);
    
    expect(screen.getByText('Generate Trade Signal')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<EinsteinGenerateButton onClick={handleClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state with spinner', () => {
    render(<EinsteinGenerateButton onClick={() => {}} loading={true} />);
    
    expect(screen.getByText('Generating...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('is disabled when loading', () => {
    render(<EinsteinGenerateButton onClick={() => {}} loading={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<EinsteinGenerateButton onClick={() => {}} disabled={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('does not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(<EinsteinGenerateButton onClick={handleClick} disabled={true} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(<EinsteinGenerateButton onClick={() => {}} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Generate Einstein trade signal');
  });

  it('has loading accessibility attributes when loading', () => {
    render(<EinsteinGenerateButton onClick={() => {}} loading={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Generating trade signal...');
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});
