import { useQuery, useQueryClient } from 'react-query';
import { ReactNode, useMemo } from 'react';
import { ButtonProps, StyledButtonProps } from '../components/buttons/Button';
import { ModalSize } from '../components/modals/common/types';

export const PROMPT_KEY = 'prompt';

export type PromptButtonProps = StyledButtonProps &
  Omit<ButtonProps<'button'>, 'onClick'> & {
    title?: string;
  };

export type PromptOptions = {
  title: string;
  description?: string | ReactNode;
  okButton?: PromptButtonProps;
  cancelButton?: PromptButtonProps;
  content?: ReactNode;
  promptSize?: ModalSize.XSmall | ModalSize.Small;
  className?: {
    modal?: string;
    title?: string;
    description?: string;
    buttons?: string;
    ok?: string;
    cancel?: string;
  };
};

type Prompt = {
  options: PromptOptions | null;
  onSuccess: () => void;
  onFail: () => void;
};

type UsePromptRet = {
  showPrompt: (options: PromptOptions) => Promise<boolean>;
  prompt: Prompt;
};

export function usePrompt(): UsePromptRet {
  const client = useQueryClient();
  const { data: prompt } = useQuery<Prompt>(PROMPT_KEY, () =>
    client.getQueryData<Prompt>(PROMPT_KEY),
  );
  const setPrompt = (data: Prompt) => client.setQueryData(PROMPT_KEY, data);

  const showPrompt = (promptOptions: PromptOptions): Promise<boolean> =>
    new Promise((resolve) => {
      const closeWith = (result: boolean) => {
        resolve(result);
        setPrompt(null);
      };
      const newPrompt: Prompt = {
        options: promptOptions,
        onFail: () => closeWith(false),
        onSuccess: () => closeWith(true),
      };
      setPrompt(newPrompt);
    });

  return useMemo(
    () => ({
      showPrompt,
      prompt,
    }),
    // @NOTE see https://dailydotdev.atlassian.net/l/cp/dK9h1zoM
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prompt],
  );
}
