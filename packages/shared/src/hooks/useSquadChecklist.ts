import { useMemo } from 'react';
import { InstallExtensionChecklistStep } from '../components/checklist/InstallExtensionChecklistStep';
import { NotificationChecklistStep } from '../components/checklist/NotificationChecklistStep';
import { SharePostChecklistStep } from '../components/checklist/SharePostChecklistStep';
import { SquadWelcomeChecklistStep } from '../components/checklist/SquadWelcomeChecklistStep';
import { ActionType } from '../graphql/actions';
import { SourceMemberRole, Squad } from '../graphql/sources';
import {
  ChecklistStepType,
  createChecklistStep,
  actionsPerRoleMap,
  SQUAD_CHECKLIST_VISIBLE_KEY,
} from '../lib/checklist';
import { useActions } from './useActions';
import { UseChecklist, useChecklist } from './useChecklist';
import usePersistentContext from './usePersistentContext';

type UseSquadChecklistProps = {
  squad: Squad;
};

type UseSquadChecklist = UseChecklist & {
  isChecklistVisible: boolean;
  setChecklistVisible: (value: boolean) => void;
};

const useSquadChecklist = ({
  squad,
}: UseSquadChecklistProps): UseSquadChecklist => {
  const { actions } = useActions();

  const stepsMap = useMemo<
    Partial<Record<ActionType, ChecklistStepType>>
  >(() => {
    return {
      [ActionType.CreateSquad]: createChecklistStep({
        type: ActionType.CreateSquad,
        step: {
          title: 'Create a squad',
          description:
            'Create your first squad and start sharing posts with other members.',
        },
        actions,
      }),
      [ActionType.JoinSquad]: createChecklistStep({
        type: ActionType.JoinSquad,
        step: {
          title: 'Join a squad',
          description:
            'Join your first squad and start sharing posts with other members.',
        },
        actions,
      }),
      [ActionType.EditWelcomePost]: createChecklistStep({
        type: ActionType.EditWelcomePost,
        step: {
          title: 'Customize the welcome post',
          description: `The welcome post is where your new squad members will start their journey. You can welcome them and explain the behavior and rules that are expected.`,
        },
        actions,
      }),
      [ActionType.SquadFirstComment]: createChecklistStep({
        type: ActionType.SquadFirstComment,
        step: {
          title: "Let people know you're here",
          description: `Welcome to the ${squad.name} squad. Start your journey by saying hi.`,
          component: SquadWelcomeChecklistStep,
        },
        actions,
      }),
      [ActionType.SquadFirstPost]: createChecklistStep({
        type: ActionType.SquadFirstPost,
        step: {
          title: 'Share your first post',
          description:
            'Share your first post to help other squad members discover content you found interesting.',
          component: SharePostChecklistStep,
        },
        actions,
      }),
      [ActionType.SquadInvite]: createChecklistStep({
        type: ActionType.SquadInvite,
        step: {
          title: 'Invite a member',
          description:
            'Invite a member to your squad and start sharing posts with them.',
        },
        actions,
      }),
      [ActionType.BrowserExtension]: createChecklistStep({
        type: ActionType.BrowserExtension,
        step: {
          title: 'Download browser extension',
          description:
            'Get one personalized feed for all the knowledge you need. Make learning a daily habit or just do something useful while you’re in endless meetings.',
          component: InstallExtensionChecklistStep,
        },
        actions,
      }),
      [ActionType.EnableNotification]: createChecklistStep({
        type: ActionType.EnableNotification,
        step: {
          title: 'Subscribe for updates',
          description: `One last thing! To get the best out of squads stay tuned about the most important activity on ${squad.name}. No spam, we promise!`,
          component: NotificationChecklistStep,
        },
        actions,
      }),
    };
  }, [squad, actions]);

  const steps = useMemo(() => {
    const actionsForRole =
      actionsPerRoleMap[squad.currentMember.role] ||
      actionsPerRoleMap[SourceMemberRole.Member];

    return actionsForRole
      .map((actionType) => {
        return stepsMap[actionType];
      })
      .filter(Boolean);
  }, [squad.currentMember, stepsMap]);

  const checklist = useChecklist({ steps });

  const [isChecklistVisible, setChecklistVisible] = usePersistentContext(
    SQUAD_CHECKLIST_VISIBLE_KEY,
    true,
  );

  return useMemo(() => {
    return {
      ...checklist,
      isChecklistVisible,
      setChecklistVisible,
    };
  }, [checklist, isChecklistVisible, setChecklistVisible]);
};

export { useSquadChecklist };
