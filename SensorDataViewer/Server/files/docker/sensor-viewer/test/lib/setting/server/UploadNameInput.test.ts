import { act, cleanup, render } from '@testing-library/svelte';
import * as urql from '@urql/svelte';
import { writable } from 'svelte/store';
import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import UploadNameInput from '../../../../src/lib/setting/server/UploadNameInput.svelte';

describe('UploadNameInput.svelt', () => {
  beforeEach(() => {
    vi.mock('@urql/svelte');
  });

  afterEach(() => cleanup());

  it('mount', () => {
    const { container, getByRole } = render(UploadNameInput);
    expect(getByRole('textbox')).toBeTruthy();
    expect(container.innerHTML).toMatchSnapshot();
  });

  it('error message', () => {
    const ERROR_MESSAGE = 'error message';
    const { container, getByText } = render(UploadNameInput, {
      props: { error: [ERROR_MESSAGE] },
    });
    expect(getByText(ERROR_MESSAGE)).toBeTruthy();
    expect(container.innerHTML).toMatchSnapshot();
  });

  describe('exist check', () => {
    const result = writable({ fetching: false, data: undefined, error: undefined });

    beforeEach(() => {
      result.set({ fetching: true, data: undefined, error: undefined });
      const spy = vi.spyOn(urql, 'queryStore');
      spy.mockReturnValue(result);
    });

    it('new name', async () => {
      const MESSAGE = '未登録の名前。新たな設定として登録されます。';
      const { component, getByText } = render(UploadNameInput, { props: { value: 'setting-0' } });
      const handler = vi.fn();
      component.$on('notify', handler);

      await act(() => {
        result.update((x) => {
          const data = {
            viewer_config: [1, 2].map(
              (n) => ({ id: n, name: `setting-${n}` }),
            ),
          };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });
      expect(getByText(MESSAGE)).toBeTruthy();
      const { detail } = handler.mock.calls[0][0];
      expect(detail).toHaveProperty('data');
      expect(detail).not.toHaveProperty('error');
    });

    it('exist name', async () => {
      const MESSAGE = '登録済みの名前。登録済みの設定内容が更新されます。';
      const { component, getByText } = render(UploadNameInput, { props: { value: 'setting-2' } });
      const handler = vi.fn();
      component.$on('notify', handler);

      await act(() => {
        result.update((x) => {
          const data = {
            viewer_config: [1, 2].map(
              (n) => ({ id: n, name: `setting-${n}` }),
            ),
          };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });
      expect(getByText(MESSAGE)).toBeTruthy();
      const { detail } = handler.mock.calls[0][0];
      expect(detail).toHaveProperty('data');
      expect(detail).not.toHaveProperty('error');
    });
  });

  describe('error', () => {
    const ERROR_MESSAGE = '[Network] Failed to fetch';
    const result = writable({ fetching: false, data: undefined, error: undefined });

    beforeEach(() => {
      result.set({ fetching: true, data: undefined, error: undefined });
      const spy = vi.spyOn(urql, 'queryStore');
      spy.mockReturnValue(result);
    });

    it('network error', async () => {
      const { component } = render(UploadNameInput);
      const handler = vi.fn();
      component.$on('notify', handler);

      await act(() => {
        result.update((x) => {
          const error = { message: ERROR_MESSAGE };
          const fetching = false;
          return { ...x, fetching, error };
        });
      });
      expect(handler).toHaveBeenCalledOnce();
      expect(handler.mock.calls[0][0]?.detail).toMatchObject({ error: { message: ERROR_MESSAGE } });
    });
  });
});
