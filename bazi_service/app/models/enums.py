"""Closed sets shared across the BaZi contract.

Keys mirror lib/contracts/bazi.ts exactly. Chinese display names live in
DISPLAY_* maps so the API stays romanised while the UI can render 甲/子/比肩.
"""

from enum import Enum


class ElementKey(str, Enum):
    WOOD = "wood"
    FIRE = "fire"
    EARTH = "earth"
    METAL = "metal"
    WATER = "water"


class HeavenlyStem(str, Enum):
    JIA = "jia"
    YI = "yi"
    BING = "bing"
    DING = "ding"
    WU = "wu"
    JI = "ji"
    GENG = "geng"
    XIN = "xin"
    REN = "ren"
    GUI = "gui"


class EarthlyBranch(str, Enum):
    ZI = "zi"
    CHOU = "chou"
    YIN = "yin"
    MAO = "mao"
    CHEN = "chen"
    SI = "si"
    # suffixed to avoid collision with the WU stem
    WU_BRANCH = "wu_branch"
    WEI = "wei"
    SHEN = "shen"
    YOU = "you"
    XU = "xu"
    HAI = "hai"


class TenGod(str, Enum):
    FRIEND = "friend"
    ROB_WEALTH = "rob_wealth"
    EATING_GOD = "eating_god"
    HURTING_OFFICER = "hurting_officer"
    INDIRECT_WEALTH = "indirect_wealth"
    DIRECT_WEALTH = "direct_wealth"
    SEVEN_KILLINGS = "seven_killings"
    DIRECT_OFFICER = "direct_officer"
    INDIRECT_RESOURCE = "indirect_resource"
    DIRECT_RESOURCE = "direct_resource"


class DayMasterStrength(str, Enum):
    VERY_STRONG = "very_strong"
    SOMEWHAT_STRONG = "somewhat_strong"
    BALANCED = "balanced"
    SOMEWHAT_WEAK = "somewhat_weak"
    VERY_WEAK = "very_weak"


class SpecialPattern(str, Enum):
    FOLLOWING_WEALTH = "following_wealth"
    FOLLOWING_OFFICER = "following_officer"
    DOMINANT_ELEMENT = "dominant_element"
    DUAL_QI_FORMATION = "dual_qi_formation"


class PillarLabel(str, Enum):
    YEAR = "year"
    MONTH = "month"
    DAY = "day"
    HOUR = "hour"


class LocationSource(str, Enum):
    DROPDOWN = "dropdown"
    MANUAL_COORDINATES = "manual_coordinates"


class Gender(str, Enum):
    FEMALE = "female"
    MALE = "male"
    UNSPECIFIED = "unspecified"


class Calendar(str, Enum):
    SOLAR = "solar"
    LUNAR = "lunar"


class QiTier(str, Enum):
    PRIMARY = "primary"
    MIDDLE = "middle"
    RESIDUAL = "residual"


class StemPosition(str, Enum):
    STEM = "stem"
    HIDDEN = "hidden"


class Disposition(str, Enum):
    USEFUL = "useful"
    UNFAVOURABLE = "unfavourable"
    NEUTRAL = "neutral"


class AdvisoryDomain(str, Enum):
    CAREER = "career"
    STUDY = "study"
    WEALTH = "wealth"


class FactorKey(str, Enum):
    SEASONAL_COMMAND = "seasonal_command"
    ROOTEDNESS = "rootedness"
    REVEALED_SUPPORT = "revealed_support"
    ASSISTING_SUPPORT = "assisting_support"


# --------------------------------------------------------------------- #
# Display maps — the frontend may use these instead of hardcoding its own.
# --------------------------------------------------------------------- #

DISPLAY_STEM = {
    HeavenlyStem.JIA: "甲",
    HeavenlyStem.YI: "乙",
    HeavenlyStem.BING: "丙",
    HeavenlyStem.DING: "丁",
    HeavenlyStem.WU: "戊",
    HeavenlyStem.JI: "己",
    HeavenlyStem.GENG: "庚",
    HeavenlyStem.XIN: "辛",
    HeavenlyStem.REN: "壬",
    HeavenlyStem.GUI: "癸",
}

DISPLAY_BRANCH = {
    EarthlyBranch.ZI: "子",
    EarthlyBranch.CHOU: "丑",
    EarthlyBranch.YIN: "寅",
    EarthlyBranch.MAO: "卯",
    EarthlyBranch.CHEN: "辰",
    EarthlyBranch.SI: "巳",
    EarthlyBranch.WU_BRANCH: "午",
    EarthlyBranch.WEI: "未",
    EarthlyBranch.SHEN: "申",
    EarthlyBranch.YOU: "酉",
    EarthlyBranch.XU: "戌",
    EarthlyBranch.HAI: "亥",
}

DISPLAY_TEN_GOD = {
    TenGod.FRIEND: "比肩",
    TenGod.ROB_WEALTH: "劫财",
    TenGod.EATING_GOD: "食神",
    TenGod.HURTING_OFFICER: "伤官",
    TenGod.INDIRECT_WEALTH: "偏财",
    TenGod.DIRECT_WEALTH: "正财",
    TenGod.SEVEN_KILLINGS: "七杀",
    TenGod.DIRECT_OFFICER: "正官",
    TenGod.INDIRECT_RESOURCE: "偏印",
    TenGod.DIRECT_RESOURCE: "正印",
}

DISPLAY_ELEMENT = {
    ElementKey.WOOD: "木",
    ElementKey.FIRE: "火",
    ElementKey.EARTH: "土",
    ElementKey.METAL: "金",
    ElementKey.WATER: "水",
}

DISPLAY_PATTERN = {
    SpecialPattern.FOLLOWING_WEALTH: "从财格",
    SpecialPattern.FOLLOWING_OFFICER: "从官杀格",
    SpecialPattern.DOMINANT_ELEMENT: "专旺格",
    SpecialPattern.DUAL_QI_FORMATION: "两气成象",
}

DISPLAY_STRENGTH = {
    DayMasterStrength.VERY_STRONG: "太旺",
    DayMasterStrength.SOMEWHAT_STRONG: "偏旺",
    DayMasterStrength.BALANCED: "中和",
    DayMasterStrength.SOMEWHAT_WEAK: "偏弱",
    DayMasterStrength.VERY_WEAK: "太弱",
}
